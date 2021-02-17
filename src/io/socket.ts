import net from "net";
import { TextDecoder, TextEncoder } from "util";
import {
  EventName,
  IBApiCreationOptions,
  MAX_SUPPORTED_SERVER_VERSION,
  MIN_SERVER_VER_SUPPORTED,
} from "../api/api";
import MIN_SERVER_VER from "../api/data/enum/min-server-version";
import { ErrorCode } from "../api/errorCode";
import configuration from "../common/configuration";
import { Controller } from "./controller";
import { OUT_MSG_ID } from "./encoder";

/**
 * @hidden
 * envelope encoding, applicable to useV100Plus mode only
 */
const MIN_VERSION_V100 = 100;

/**
 * @hidden
 * max message size, taken from Java client, applicable to useV100Plus mode only
 */
const MAX_V100_MESSAGE_LENGTH = 0xffffff;

/** @hidden */
const EOL = "\0";

/**
 * @internal
 *
 * This class implements low-level details on the communication protocol of the
 * TWS/IB Gateway API server.
 */
export class Socket {
  /**
   * Create a new [[Socket]] object.
   *
   * @param controller The parent [[Controller]] object.
   * @param options The API creation options.
   */
  constructor(
    private controller: Controller,
    private options: IBApiCreationOptions = {}
  ) {
    this._clientId = this.options.clientId ?? configuration.default_client_id;
    this.options.host = this.options.host;
    this.options.port = this.options.port;
  }

  /** The TCP client socket. */
  private client?: net.Socket;

  /** `true` if the TCP socket is connected and [[OUT_MSG_ID.START_API]] has been sent, `false` otherwise.  */
  private _connected = false;

  /** The IB API Server version, or 0 if not connected yet. */
  private _serverVersion = 0;

  /** The server connection time. */
  private _serverConnectionTime = "";

  /** Data fragment accumulation buffer. */
  private dataFragment = "";

  /** `true` if no message from server has been received yet, `false` otherwise. */
  private neverReceived = true;

  /** `true` if waiting for completion of an async operation, `false` otherwise.  */
  private waitingAsync = false;

  /** `true` if V!00Pls protocol shall be used, `false` otherwise.  */
  private useV100Plus = true;

  /** Accumulation buffer for fragmented V100 messages */
  private _v100MessageBuffer: Buffer = Buffer.alloc(0);

  /** The current client id. */
  private _clientId = configuration.default_client_id;

  /** Returns `true` if connected to TWS/IB Gateway, `false` otherwise.  */
  get connected(): boolean {
    return this._connected;
  }

  /** Returns the IB API Server version. */
  get serverVersion(): number {
    return this._serverVersion;
  }

  /** The server connection time. */
  get serverConnectionTime(): string {
    return this._serverConnectionTime;
  }

  /** Get the current client id. */
  get clientId(): number {
    return this._clientId;
  }

  /**
   * Disable usage of V100Plus protocol.
   */
  disableUseV100Plus(): void {
    this.useV100Plus = false;
  }

  /**
   * Connect to the API server.
   *
   * @param clientId A unique client id (per TWS or IB Gateway instance).
   * When not specified, the client from [[IBApiCreationOptions]] or the
   * default client id (0) will used.
   */
  connect(clientId?: number): void {
    // update client id

    if (clientId !== undefined) {
      this._clientId = clientId;
    }

    // pause controller while API startup sequence

    this.controller.pause();

    // reset state

    this.dataFragment = "";
    this.neverReceived = true;
    this.waitingAsync = false;
    this._v100MessageBuffer = Buffer.alloc(0);

    // create and connect TCP socket

    this.client = net
      .connect(
        {
          host: this.options.host ?? configuration.ib_host,
          port: this.options.port ?? configuration.ib_port,
        },
        () => this.onConnect()
      )
      .on("data", (data) => this.onData(data))
      .on("close", () => this.onEnd())
      .on("end", () => this.onEnd())
      .on("error", (error) => this.onError(error));
  }

  /**
   * Disconnect from API server.
   */
  disconnect(): void {
    // pause controller while connection is down.

    this.controller.pause();

    // disconnect TCP socket.

    this.client?.end();
  }

  /**
   * Send tokens to API server.
   */
  send(tokens: unknown[]): void {
    // flatten arrays and convert boolean types to 0/1

    tokens = this.flattenDeep(tokens);
    tokens.forEach((value, i) => {
      if (value === true || value === false || value instanceof Boolean) {
        tokens[i] = value ? 1 : 0;
      }
    });

    let stringData = tokens.join(EOL);

    if (this.useV100Plus) {
      let utf8Data;

      if (tokens[0] === "API\0") {
        // this is the initial API version message, which is special:
        // length is encoded after the 'API\0', followed by the actual tokens.

        const skip = 5; // 1 x 'API\0' token + 4 x length tokens
        stringData = tokens.slice(skip)[0] as string;

        utf8Data = [
          ...this.stringToUTF8Array(tokens[0]),
          ...tokens.slice(1, skip),
          ...this.stringToUTF8Array(stringData),
        ];
      } else {
        utf8Data = this.stringToUTF8Array(stringData);
      }

      // add length prefix only if not a string (strings use pre-V100 style)
      if (typeof tokens[0] !== "string") {
        utf8Data = [
          ...this.numberTo32BitBigEndian(utf8Data.length + 1),
          ...utf8Data,
          0,
        ];
      }

      this.client?.write(new Uint8Array(utf8Data));
    } else {
      this.client?.write(stringData + EOL);
    }

    this.controller.emitEvent(EventName.sent, tokens, stringData);
  }

  /**
   * Called when data on the TCP socket has been arrived.
   */
  private onData(data: Buffer): void {
    if (this.useV100Plus) {
      let dataToParse = data;
      if (this._v100MessageBuffer.length > 0) {
        dataToParse = Buffer.concat([this._v100MessageBuffer, data]);
      }
      if (dataToParse.length > MAX_V100_MESSAGE_LENGTH) {
        // At this point we have buffered enough data that we have exceeded the max known message length,
        // at which point this is likely an unrecoverable state and we should discard all prior data,
        // and disconnect the socket
        this._v100MessageBuffer = Buffer.alloc(0);
        this.onError(
          new Error(
            `Message of size ${dataToParse.length} exceeded max message length ${MAX_V100_MESSAGE_LENGTH}`
          )
        );
        this.disconnect();
        return;
      }
      let messageBufferOffset = 0;
      while (messageBufferOffset + 4 < dataToParse.length) {
        let currentMessageOffset = messageBufferOffset;
        const msgSize = dataToParse.readInt32BE(currentMessageOffset);
        currentMessageOffset += 4;
        if (currentMessageOffset + msgSize <= dataToParse.length) {
          const utf8Data: number[] = new Array(msgSize);
          for (let i = 0; i < msgSize; i++) {
            utf8Data[i] = dataToParse.readUInt8(currentMessageOffset++);
          }
          this.onMessage(new TextDecoder().decode(new Uint8Array(utf8Data)));
          messageBufferOffset = currentMessageOffset;
        } else {
          // We can't parse further, the message is incomplete
          break;
        }
      }
      if (messageBufferOffset != dataToParse.length) {
        // There is data left in the buffer, save it for the next data packet
        this._v100MessageBuffer = dataToParse.slice(messageBufferOffset);
      } else {
        this._v100MessageBuffer = Buffer.alloc(0);
      }
    } else {
      this.onMessage(data.toString());
    }
  }

  /**
   * Called when new tokens have been received from server.
   */
  private onMessage(data: string): void {
    // tokenize

    const dataWithFragment = this.dataFragment + data;

    let tokens = dataWithFragment.split(EOL);
    if (tokens[tokens.length - 1] !== "") {
      this.dataFragment = tokens[tokens.length - 1];
    } else {
      this.dataFragment = "";
    }

    tokens = tokens.slice(0, -1);
    this.controller.emitEvent(EventName.received, tokens.slice(0), data);

    // handle message data

    if (this.neverReceived) {
      // first message

      this.neverReceived = false;

      this.onServerVersion(tokens);
    } else {
      // post to queue

      if (this.useV100Plus) {
        this.controller.onMessage(tokens);
      } else {
        this.controller.onTokens(tokens);
      }

      // process queue

      this.controller.processIngressQueue();
    }

    // resume from async state

    if (this.waitingAsync) {
      this.waitingAsync = false;
      this.controller.resume();
    }
  }

  /**
   * Called when first data has arrived on the connection.
   */
  private onServerVersion(tokens: string[]): void {
    this._connected = true;

    this._serverVersion = parseInt(tokens[0], 10);
    this._serverConnectionTime = tokens[1];

    if (
      this.useV100Plus &&
      (this._serverVersion < MIN_VERSION_V100 ||
        this._serverVersion > MAX_SUPPORTED_SERVER_VERSION)
    ) {
      this.disconnect();
      this.controller.emitError(
        "Unsupported Version",
        ErrorCode.UNSUPPORTED_VERSION,
        -1
      );
      return;
    }

    if (this._serverVersion < MIN_SERVER_VER_SUPPORTED) {
      this.disconnect();
      this.controller.emitError(
        "The TWS is out of date and must be upgraded.",
        ErrorCode.UPDATE_TWS,
        -1
      );
      return;
    }

    this.startAPI();

    this.controller.emitEvent(EventName.connected);
    this.controller.emitEvent(
      EventName.server,
      this.serverVersion,
      this.serverConnectionTime
    );
  }

  /**
   * Start the TWS/IB Gateway API.
   */
  private startAPI(): void {
    // start API

    const VERSION = 2;
    if (this.serverVersion >= 3) {
      if (this.serverVersion < MIN_SERVER_VER.LINKING) {
        this.send([this._clientId]);
      } else {
        if (this.serverVersion >= MIN_SERVER_VER.OPTIONAL_CAPABILITIES) {
          this.send([OUT_MSG_ID.START_API, VERSION, this._clientId, ""]);
        } else {
          this.send([OUT_MSG_ID.START_API, VERSION, this._clientId]);
        }
      }
    }

    // resume controller

    this.controller.resume();
  }

  /**
   * Called when TCP socket has been connected.
   */
  private onConnect(): void {
    // send client version (unless Version > 100)
    if (!this.useV100Plus) {
      this.send([configuration.client_version]);
      this.send([this._clientId]);
    } else {
      // Switch to GW API (Version 100+ requires length prefix)
      const config = this.buildVersionString(
        MIN_VERSION_V100,
        MAX_SUPPORTED_SERVER_VERSION
      );
      // config = config + connectOptions --- connectOptions are for IB internal use only: not supported
      this.send([
        "API\0",
        ...this.numberTo32BitBigEndian(config.length),
        config,
      ]);
    }
  }

  /**
   * Called when TCP socket connection has been closed.
   */
  private onEnd(): void {
    const wasConnected = this._connected;
    this._connected = false;
    if (wasConnected) {
      this.controller.emitEvent(EventName.disconnected);
    }

    this.controller.resume();
  }

  /**
   * Called when an error occurred on the TCP socket connection.
   */
  private onError(err: Error): void {
    this.controller.emitError(err.message, ErrorCode.CONNECT_FAIL, -1);
  }

  /**
   * Build a V100Plus API version string.
   */
  private buildVersionString(minVersion: number, maxVersion: number): string {
    return (
      "v" +
      (minVersion < maxVersion ? minVersion + ".." + maxVersion : minVersion)
    );
  }

  /**
   * Convert a (integer) number to a 4-byte big endian byte array.
   */
  private numberTo32BitBigEndian(val: number): number[] {
    const result: number[] = new Array(4);
    let pos = 0;
    result[pos++] = 0xff & (val >> 24);
    result[pos++] = 0xff & (val >> 16);
    result[pos++] = 0xff & (val >> 8);
    result[pos++] = 0xff & val;
    return result;
  }

  /**
   * Encode a string to a UTF8 byte array.
   */
  private stringToUTF8Array(val: string): number[] {
    return Array.from(new TextEncoder().encode(val));
  }

  /**
   * Flatten an array.
   *
   * Also works for nested arrays (i.e. arrays inside arrays inside arrays)
   */
  private flattenDeep(arr: unknown[], result: unknown[] = []): unknown[] {
    for (let i = 0, length = arr.length; i < length; i++) {
      const value = arr[i];
      if (Array.isArray(value)) {
        this.flattenDeep(value, result);
      } else {
        result.push(value);
      }
    }
    return result;
  }
}
