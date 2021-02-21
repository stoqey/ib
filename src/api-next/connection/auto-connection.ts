import { EventName } from "../..";
import { BehaviorSubject, Observable } from "rxjs";
import { IBApi, IBApiCreationOptions } from "../../api/api";
import { ConnectionState } from "./connection-state";

/**
 * This class implements auto re-connection for the [[IBApi]].
 *
 * It will monitor the connection state and poll the TWS / IB Gateway at
 * regular intervals to also detect abnormal connection drops.
 * If a connection drop is detected, a new connection will be initiated
 * after the specified reconnection interval.
 */
export class IBApiAutoConnection extends IBApi {
  /**
   * Create an [[IBApiAutoConnection]] object.
   *
   * @param reconnectInterval The auto-reconnect interval in milliseconds.
   * @param options Creation options.
   */
  constructor(
    public readonly reconnectInterval: number,
    public readonly options?: IBApiCreationOptions
  ) {
    super(options);
    this.on(EventName.connected, () => this.onConnected());
    this.on(EventName.disconnected, () => this.onDisconnected());
    this.on(
      EventName.currentTime,
      () => (this.lastCurrentTimeIngress = Date.now())
    );
  }

  /**
   * Tick interval of the connection watchdog in milliseconds.
   *
   * The connection to TWS / IB Gateway will be checked at
   * this interval by requesting the current TWS time.
   * If there is no reply from TWS until two consecutive watchdog ticks,
   * the connection will be considered as "dead" and a new connection
   * will be initialized after the [[reconnectInterval]].
   */
  readonly CONNECTION_WATCHDOG_INTERVAL = 4000;

  /**
   * If defined, this is the client id that will be used on all
   * re-connection attempt. If undefined [[currentClientId]] will
   * be used and incremented on each attempt.
   */
  private fixedClientId?: number;

  /** The current client id. */
  private currentClientId: number;

  /** true if auto re-connect is enabled, false otherwise. */
  private autoReconnectEnabled = true;

  /** The auto re-connect timeout. */
  private reconnectionTimeout?: NodeJS.Timeout;

  /** The connection-watchdog timeout. */
  private connectionWatchdogTimeout?: NodeJS.Timeout;

  /** Ingress timestamp of last received [[EventName.currentTime]] event. */
  private lastCurrentTimeIngress?: number;

  /** The connection-state [[BehaviorSubject]]. */
  private readonly _connectionState = new BehaviorSubject<ConnectionState>(
    ConnectionState.Disconnected
  );

  /** Get the connection-state as an [[Observable]] . */
  get connectionState(): Observable<ConnectionState> {
    return this._connectionState;
  }

  /**
   * Connect to the TWS or IB Gateway.
   *
   * @param clientId A fixed client id to be used on all connection
   * attempts. If not specified, the first connection will use the
   * default client id (0) and increment it with each re-connection
   * attempt.
   *
   * @sse [[connectionState]] for observing the connection state.
   */
  connect(clientId?: number): IBApi {
    this.autoReconnectEnabled = true;
    this.fixedClientId = clientId;
    this.currentClientId =
      (clientId === undefined ? this.options?.clientId : clientId) ?? 0;
    if (this._connectionState.getValue() === ConnectionState.Disconnected) {
      this._connectionState.next(ConnectionState.Connecting);
      super.connect(this.currentClientId);
    }
    return this;
  }

  /**
   * Disconnect from the TWS or IB Gateway.
   *
   * Use [[connectionState]] for observing the connection state.
   */
  disconnect(): IBApi {
    this.autoReconnectEnabled = false;
    if (this._connectionState.getValue() !== ConnectionState.Disconnected) {
      super.disconnect();
    }
    return this;
  }

  /**
   * Called when [[EventName.connected]] event has been received.
   */
  private onConnected(): void {
    // signal ConnectionState.Connected

    if (this._connectionState.getValue() !== ConnectionState.Connected) {
      this._connectionState.next(ConnectionState.Connected);
    }

    // cancel reconnect timer and run the connection watchdog

    this.stopReConnectTimer();
    this.runWatchdog();
  }

  /**
   * Re-establish the connection.
   */
  private reConnect(): void {
    // verify and update state
    if (
      this._connectionState.getValue() !== ConnectionState.Disconnected ||
      this.autoReconnectEnabled
    ) {
      return;
    }

    this._connectionState.next(ConnectionState.Connecting);

    // connect to IB

    this.currentClientId =
      this.fixedClientId !== undefined
        ? this.fixedClientId
        : this.currentClientId + 1;

    super.connect(this.currentClientId);
  }

  /**
   * Start the re-connection timer.
   */
  private runReConnectTimer(): void {
    // verify state
    if (this.reconnectionTimeout === undefined || !this.reconnectInterval) {
      return;
    }

    this.reconnectionTimeout = setTimeout(() => {
      this.reConnect();
    }, this.reconnectInterval);
  }

  /**
   * Stop the re-connection timer.
   */
  private stopReConnectTimer(): void {
    // verify state
    if (this.reconnectionTimeout === undefined) {
      return;
    }

    // reset timeout

    clearTimeout(this.reconnectionTimeout);
    delete this.reconnectionTimeout;
  }

  /**
   * Start the connection watchdog
   */
  private runWatchdog(): void {
    // verify state
    if (this.connectionWatchdogTimeout) {
      return;
    }

    // run watchdog

    let lastReqCurrentTimeEgress = 0;
    this.connectionWatchdogTimeout = setInterval(() => {
      if (this.lastCurrentTimeIngress !== undefined) {
        const elapsed = this.lastCurrentTimeIngress - lastReqCurrentTimeEgress;
        if (
          lastReqCurrentTimeEgress &&
          elapsed > this.CONNECTION_WATCHDOG_INTERVAL * 2
        ) {
          this.onDisconnected();
          return;
        }
      }
      lastReqCurrentTimeEgress = Date.now();
      this.reqCurrentTime();
    }, this.CONNECTION_WATCHDOG_INTERVAL);
  }

  /**
   * Stop the connection watchdog.
   */
  private stopWatchdog(): void {
    // verify state
    if (this.connectionWatchdogTimeout === undefined) {
      return;
    }

    // reset interval

    clearInterval(this.connectionWatchdogTimeout);
    delete this.connectionWatchdogTimeout;
  }

  /**
   * Called when an [[EventName.disconnected]] event has been received,
   * or the connection-watchdog has detected a dead connection.
   */
  private onDisconnected(): void {
    // verify state and update state
    if (this.isConnected) {
      this.disconnect();
    }

    if (this._connectionState.getValue() !== ConnectionState.Disconnected) {
      this._connectionState.next(ConnectionState.Disconnected);
    }

    // stop watch and run re-connect timer

    this.stopWatchdog();
    this.runReConnectTimer();
  }
}