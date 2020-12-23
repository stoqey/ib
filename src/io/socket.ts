import net from "net";
import { EventName, IBApiCreationOptions, MIN_SERVER_VER } from "../api/api";
import { Controller } from "./controller";
import { Config } from "../config";
import { OUT_MSG_ID } from "./encoder";

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
    private options?: IBApiCreationOptions) {
      this.options = this.options ?? {};
      this.options.clientId = this.options.clientId ?? Config.DEFAULT_CLIENT_ID;
      this.options.host = this.options.host ?? Config.DEFAULT_HOST;
      this.options.port = this.options.port ?? Config.DEFAULT_PORT;
  }

  /** The TCP client socket. */
  private client: net.Socket;

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

  /**
   * Connect to the API server.
   */
  connect(): void {

    // pause controller while API startup sequence

    this.controller.pause();

    // reset state

    this.dataFragment = "";
    this.neverReceived = true;
    this.waitingAsync = false;

    // create and connect TCP socket

    this.client = net.connect({
      host: this.options.host,
      port: this.options.port
    }, () => this.onConnect())
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

    this.client.end();
  }

  /**
   * Send tokens to API server.
   */
  send(tokens: unknown[]): void {

    // TODO add support for V100Plus (https://github.com/stoqey/ib/issues/3)

    // flatten arrays and convert boolean types to 0/1

    tokens = this.flattenDeep(tokens);
    tokens.forEach((value, i) => {
      if (value === true || value === false || value instanceof Boolean) {
        tokens[i] = value ? 1 : 0;
      }
    });

    // join tokens to text string, send to socket and emit event

    const data = tokens.join(EOL) + EOL;

    this.client.write(data);
    this.controller.emit(EventName.sent, tokens, data);
  }

  /**
   * Called when data on the TCP socket has been arrived.
   */
  private onData(data: Buffer): void {

    // TODO add support for V100Plus (https://github.com/stoqey/ib/issues/3)

    const dataWithFragment = this.dataFragment + data.toString();

    let tokens = dataWithFragment.split(EOL);
    if (tokens[tokens.length - 1] !== "") {
      this.dataFragment = tokens[tokens.length - 1];
    } else {
      this.dataFragment = "";
    }

    tokens = tokens.slice(0, -1);

    this.controller.emit(EventName.received, tokens.slice(0), data);

    // handle message data

    if (this.neverReceived) {

       // first message

      this.neverReceived = false;
      this._connected = true;

      this._serverVersion = parseInt(tokens[0], 10);
      this._serverConnectionTime = tokens[1];

      this.startAPI();

      this.controller.emit(EventName.connected);
      this.controller.emit(EventName.server, this.serverVersion, this.serverConnectionTime);

    } else {

      // post to queue

      this.controller.onDataIngress(tokens);

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
   * Start the TWS/IB Gateway API.
   */
  private startAPI(): void {

    // start API

    const VERSION = 2;
    if(this.serverVersion >= 3) {
      if(this.serverVersion < MIN_SERVER_VER.LINKING) {
        this.send([this.options.clientId]);
      } else {
          if (this.serverVersion >= MIN_SERVER_VER.OPTIONAL_CAPABILITIES) {
            this.send([OUT_MSG_ID.START_API, VERSION, this.options.clientId, ""]);
          } else {
            this.send([OUT_MSG_ID.START_API, VERSION, this.options.clientId]);
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

    // send back client version as first data on the connection

    this.send([Config.CLIENT_VERSION]);
  }

  /**
   * Called when TCP socket connection has been closed.
   */
  private onEnd () {

    // change connected state and emit disconnected event

    const wasConnected = this._connected;
    this._connected = false;
    if (wasConnected) {
      this.controller.emit(EventName.disconnected);
    }

    // resume controller (drain queue into disconnected socket)

    this.controller.resume();
  }

  /**
   * Called when an error occurred on the TCP socket connection.
   */
  private onError(err: Error) {

    // emit error event

    this.controller.emit(EventName.error, err);
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
