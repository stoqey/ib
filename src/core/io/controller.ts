import CommandBuffer from "command-buffer";
import rateLimit from "function-rate-limit";

import { IBApi, IBApiCreationOptions } from "../../api/api";
import { EventName } from "../../api/data/enum/event-name";
import configuration from "../../common/configuration";
import { ErrorCode } from "../../common/errorCode";
import { Decoder, DecoderCallbacks } from "./decoder";
import { Encoder, EncoderCallbacks } from "./encoder";
import { ConnectionStatus, Socket } from "./socket";

/**
 * @internal
 *
 * This class implements the dispatcher between public API and the
 * underlying I/O code.
 */
export class Controller implements EncoderCallbacks, DecoderCallbacks {
  /**
   *
   * @param ib The [[IBApi]] object.
   * @param _options The [[IBApi]] creation options.
   */
  constructor(
    private ib: IBApi,
    private options?: IBApiCreationOptions,
  ) {
    this.socket = new Socket(this, this.options);
    this.commands.pause();
    const rate =
      options?.maxReqPerSec ?? configuration.max_req_per_second ?? 40;
    this.rateLimiter = rateLimit(rate / 10, 1000 / 10, (tokens: unknown[]) => {
      this.socket.send(tokens);
    });
  }

  /** The API socket object. */
  private socket: Socket;

  /** The command buffer. */
  private readonly commands = new CommandBuffer(Controller.execute, this);

  /** The rate limiter function. */
  private readonly rateLimiter: (tokens: unknown[]) => void;

  /** The API message encoder. */
  readonly encoder = new Encoder(this);

  /** The API message decoder. */
  readonly decoder = new Decoder(this);

  /**
   * Pause command processing.
   */
  pause(): void {
    this.commands.pause();
  }

  /**
   * Resume command processing.
   */
  resume(): void {
    this.commands.resume();
  }

  /**
   * Connect to the API server.
   */
  connect(clientId?: number): void {
    this.executeConnect(clientId);
  }

  /**
   * Disconnect from the API server.
   */
  disconnect(): void {
    this.executeDisconnect();
  }

  /**
   * Schedule an API command for sending.
   *
   * @param funcName API function name.
   * @param data Array of tokens to send.
   */
  schedule(func: () => void): void {
    this.commands.schedule(() => func());
  }

  /**
   * Send an array of tokens to the sever immediately.
   *
   * @param data Array of tokens to send.
   */
  send(...args: unknown[]): void {
    this.commands.run(() => this.executeSend(args));
  }

  /**
   * Progress the ingress data queue.
   */
  processIngressQueue(): void {
    this.decoder.process();
  }

  /**
   * Called when a message has been arrived on the API server connection.
   *
   * Used on V100 protocol.
   */
  onMessage(tokens: string[]): void {
    this.decoder.enqueueMessage(tokens);
  }

  /**
   * Called when a message has been arrived on the API server connection.
   *
   * Used on pre-V100 protocol.
   */
  onTokens(tokens: string[]): void {
    this.decoder.enqueueTokens(tokens);
  }

  /**
   * Get the API server version.
   *
   * This function is called from the [[Decoder]] and [[Encoder]]
   * (via [DecoderCallbacks.serverVersion] and [DecoderCallbacks.serverVersion]).
   */
  get serverVersion(): number {
    return this.socket.serverVersion;
  }

  /**
   * Returns `true` if currently connected to server, `false` otherwise.
   */
  get connected(): boolean {
    return this.socket.connected;
  }

  /**
   * Disable usage of V100Plus protocol.
   */
  disableUseV100Plus(): void {
    return this.socket.disableUseV100Plus();
  }

  /**
   * Send a message to the server connection.
   *
   * This function is called from the [[Encoder]] (via [EncoderCallbacks.sendMsg]).
   *
   * @param args Array of tokens to send.
   * Can contain nested arrays.
   */
  sendMsg(...tokens: unknown[]): void {
    this.rateLimiter(tokens);
  }

  /**
   * Emit an event to public API interface.
   *
   * This function is called from the [[Decoder]] (via [DecoderCallbacks.emitEvent]).
   *
   * @param eventName Event name.
   * @param args Event arguments.
   */
  emitEvent(eventName: EventName, ...args: unknown[]): void {
    // emit the event

    this.ib.emit(eventName, ...args);

    // emit 'result' and 'all' event

    if (
      eventName !== EventName.connected &&
      eventName !== EventName.disconnected &&
      eventName !== EventName.error &&
      eventName !== EventName.received &&
      eventName !== EventName.sent &&
      eventName !== EventName.server
    ) {
      this.ib.emit(EventName.result, eventName, args);
    }

    this.ib.emit(EventName.all, eventName, args);

    /*
    Important: The IBApi.EWrapper.nextValidID callback is commonly used to indicate that the connection is completed
    and other messages can be sent from the API client to TWS.
    There is the possibility that function calls made prior to this time could be dropped by TWS.
    */
    if (eventName === EventName.nextValidId) {
      // console.log("nextValidId received");
      this.resume();
    }
  }

  /**
   * Emit an information message event to public API interface.
   *
   * This function is called from the [[Decoder]] (via [DecoderCallbacks.emitInfo]).
   *
   * @param message The message text.
   * @param code The message code.
   */
  emitInfo(message: string, code: number): void {
    this.emitEvent(EventName.info, message, code);
  }

  /**
   * Emit an error event to public API interface.
   *
   * This function is called from the [[Decoder]] and [[Encoder]]
   * (via [DecoderCallbacks.emitError] and [DecoderCallbacks.emitError]).
   *
   * @param errMsg The error test message.
   * @param code The error code.
   * @param reqId RequestId associated to this error.
   * @param advancedOrderReject Additional error data (optional).
   */
  emitError(
    errMsg: string,
    code: number,
    reqId?: number,
    advancedOrderReject?: unknown,
  ): void {
    this.emitEvent(
      EventName.error,
      new Error(errMsg),
      code,
      reqId ?? ErrorCode.NO_VALID_ID,
      advancedOrderReject,
    );
  }

  /**
   * Execute a command.
   *
   * @param callback Callback function to invoke.
   * @param data Command data.
   */
  private static execute(
    callback: (data: unknown) => void,
    data: unknown,
  ): void {
    callback(data);
  }

  /**
   * Execute a connect command.
   *
   * @see [[connect]]
   */
  private executeConnect(clientId?: number): void {
    if (!this.socket.connected) {
      this.socket.connect(clientId);
    } else {
      this.emitInfo(
        "Cannot connect if already connected.",
        ErrorCode.ALREADY_CONNECTED,
      );
    }
  }

  /**
   * Execute a disconnect command.
   *
   * @see [[disconnect]]
   */
  private executeDisconnect(): void {
    if (this.socket.status >= ConnectionStatus.Connecting) {
      this.socket.disconnect();
    } else {
      this.emitInfo(
        "Cannot disconnect if already disconnected.",
        ErrorCode.NOT_CONNECTED,
      );
    }
  }

  /**
   * Send raw token data to the server connection.
   *
   * @param tokens Array of tokens to send.
   *
   * @see [[send]]
   */
  private executeSend(tokens: unknown[]): void {
    if (this.socket.connected) {
      this.socket.send(tokens);
    } else {
      this.emitError(
        "Cannot send data when disconnected.",
        ErrorCode.NOT_CONNECTED,
        ErrorCode.NO_VALID_ID,
      );
    }
  }
}
