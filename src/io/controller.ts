
import CommandBuffer from "command-buffer";
import rateLimit from "function-rate-limit";
import { Socket } from "./socket";
import { Decoder, DecoderCallbacks } from "./decoder";
import { Encoder, EncoderCallbacks } from "./encoder";
import { EventName, IBApi, IBApiCreationOptions } from "../api/api";
import { Config } from "../config";

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
    private options?: IBApiCreationOptions) {
      this.socket = new Socket(this, this.options);
  }

  /** The API socket object. */
  private socket: Socket;

  /** The command buffer. */
  private readonly commands = new CommandBuffer(Controller.execute, this);

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
  connect(): void {
    this.commands.schedule(() => this.executeConnect());
  }

  /**
   * Disconnect from the API server.
   */
  disconnect(): void {
    this.commands.schedule(() => this.executeDisconnect());
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
   */
  onMessage(tokens: string[]): void {
    this.decoder.enqueue(tokens);
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
    rateLimit(Config.MAX_REQ_PER_SECOND, 1000, () => {
      this.socket.send(tokens);
    })();
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

    if (eventName !== EventName.connected &&
        eventName !== EventName.disconnected &&
        eventName !== EventName.error &&
        eventName !== EventName.received &&
        eventName !== EventName.sent &&
        eventName !== EventName.server) {
      this.ib.emit(EventName.result, eventName, args);
    }

    this.ib.emit(EventName.all, eventName, args);
  }

   /**
   * Emit an information message event to public API interface.
   *
   * This function is called from the [[Decoder]] (via [DecoderCallbacks.emitInfo]).
   *
   * @param errMsg The message text.
   */
  emitInfo(message: string): void {
    this.emitEvent(EventName.info, message);
  }

  /**
   * Emit an error event to public API interface.
   *
   * This function is called from the [[Decoder]] and [[Encoder]]
   * (via [DecoderCallbacks.emitError] and [DecoderCallbacks.emitError]).
   *
   * @param errMsg The error test message.
   * @param data Additional error data (optional).
   */
  emitError(errMsg: string, data?: unknown): void {
    if (data === undefined) {
      this.emitEvent(EventName.error, new Error(errMsg));
    } else {
      this.emitEvent(EventName.error, new Error(errMsg), data);
    }
  }

  /**
   * Execute a command.
   *
   * @param callback Callback function to invoke.
   * @param data Command data.
   */
  private static execute(callback: (data: unknown) => void, data: unknown) {
    callback(data);
  }

  /**
   * Execute a connect command.
   *
   * @see [[connect]]
   */
  private executeConnect() {
    if (!this.socket.connected) {
      this.socket.connect();
    } else {
      this.emitError("Cannot connect if already connected.");
    }
  }

  /**
   * Execute a disconnect command.
   *
   * @see [[disconnect]]
   */
  private executeDisconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    } else {
      this.emitError("Cannot disconnect if already disconnected.");
    }
  }

  /**
   * Send an API command to the server connection.
   *
   * @param funcName API function name.
   * @param funcName API arguments.
   *
   * @see [[api]]
   */
  /*
  private executeApi(funcName: string, args: unknown[]): void {
    if (this.encoder[funcName] instanceof Function) {
      this.encoder[funcName](args);
    } else {
      throw new Error("Unknown outgoing func - " + funcName);
    }
  }*/

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
      this.emitError("Cannot send data when disconnected.");
    }
  }
}
