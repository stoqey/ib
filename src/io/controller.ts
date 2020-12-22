
import CommandBuffer from "command-buffer";
import * as C from "../constants";
import { Socket } from "./socket";
import { Incoming } from "./incoming";
import Outgoing from "./outgoing";

import { IBApi, IBApiCreationOptions } from "../api/api";

/**
 * @internal
 *
 * This class implements the dispatcher between public API and the
 * underlying I/O code.
 */
export class Controller {

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

  /** The API message serializer. */
  private readonly outgoing = new Outgoing(this);

  /** The API message de-serializer. */
  private readonly incoming = new Incoming(this);

  /** Get the API server version. */
  get serverVersion(): number {
    return this.socket.serverVersion;
  }

  /**
   * Emit an event to public API interface.
   *
   * @param args Event arguments.
   * First argument is the event name, followed by event arguments.
   */
  emit(eventName: string, ...args: unknown[]): void {

    // resolve message on Error object to a token

    if (eventName === "error" &&
    ((args[0] instanceof Error) || (args[0] as Record<string, string>).message !== undefined)) {
      args[1] = (args[1] as Record<string, string>).message;
    }

    // emit the event

    this.ib.emit(eventName, ...args);

    // emit 'result' and 'all' event

    if (eventName !== "connected" &&
        eventName !== "disconnected" &&
        eventName !== "error" &&
        eventName !== "received" &&
        eventName !== "sent" &&
        eventName !== "server") {
      this.ib.emit("result", eventName, args);
    }

    this.ib.emit("all", eventName, args);
  }

  /**
   * Emit an error event to public API interface.
   *
   * @param errMsg The error test message.
  * @param data Additional error data (optional).
   */
  emitError(errMsg: string, data?: unknown): void {
    if (data === undefined) {
      this.emit("error", new Error(errMsg));
    } else {
      this.emit("error", new Error(errMsg), data);
    }
  }

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
  api(funcName: string, ...args: unknown[]): void {
    this.commands.schedule(() => this.executeApi(funcName, args));
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
    this.incoming.process();
  }

  /**
   * Called when new data has been arrived from on the API server connection.
   */
  onDataIngress(tokens: string[]): void {
    this.incoming.enqueue(tokens);
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
  private executeApi(funcName: string, args: unknown[]): void {
    if (this.outgoing[funcName] instanceof Function) {
      this.outgoing[funcName](args);
    } else {
      throw new Error("Unknown outgoing func - " + funcName);
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
      this.emitError("Cannot send data when disconnected.");
    }
  }
}
