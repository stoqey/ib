import { ErrorCode, EventName } from "..";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { IBApi, IBApiCreationOptions } from "./api";

/** An error on the TWS / IB Gateway API. */
export interface IBApiError {
  /** The [[Error]] object. */
  error: Error;

  /** The [[IBApi]] Error Code. */
  code: ErrorCode;

  /**  The request id that caused the error, or -1. */
  reqId: number;
}

/** Status of the connection to TWS / IB Gateway. */
export enum ConnectionState {
  /** Disconnected from TWS / IB Gateway. */
  Disconnected,

  /** Current connecting to TWS / IB Gateway. */
  Connecting,

  /** Connected to TWS / IB Gateway. */
  Connected,
}

/**
 * This class hosts and [[IBApi]] object,
 * implements a connection state watchdog and (optional) automatic re-connection.
 */
export class IBApiAutoConnection {
  /**
   * Tick interval of the connection watchdog in milliseconds.
   *
   * The connection to TWS / IB Gateway will be checked at
   * this interval by requesting the current TWS time.
   * If there is no reply from TWS until next watchdog tick,
   * the connection will be considered as "dead" and a new connection
   * will be initialized after the [[reconnectInterval]].
   */
  static readonly CONNECTION_WATCHDOG_INTERVAL = 1000;

  /**
   * Create an [[IBApiNext]] object.
   *
   * @param options [[IBApi]] creation options.
   */
  constructor(options?: IBApiCreationOptions) {
    this.ib = new IBApi(options);
    this.ib.on(EventName.error, (error, code, reqId) =>
      this.onError(error, code, reqId)
    );
    this.ib.on(EventName.connected, () => this.onConnected());
    this.ib.on(EventName.disconnected, () => this.onDisconnected());
    this.ib.on(EventName.currentTime, (time) => this.onCurrentTime(time));
  }

  /** The IB API object. */
  private readonly ib: IBApi;

  /** The re-connection interval in ms, or undefined if automatic re-connection is disabled. */
  private reconnectInterval?: number;

  /** Timestamp of the last [[EventName.currentTime]] event. */
  private lastCurrentTimeTm?: number;

  /** The connection-watchdog timeout. */
  private connectionWatchdogTimeout?: NodeJS.Timeout;

  /** The reconnection timeout. */
  private reconnectionTimeout?: NodeJS.Timeout;

  /** The connection-state [[BehaviorSubject]]. */
  private readonly _connectionState = new BehaviorSubject<ConnectionState>(
    ConnectionState.Disconnected
  );

  /** The error [[Subject]]. */
  private readonly _error = new Subject<IBApiError>();

  /** The currentTime [[Subject]]. */
  private readonly _currentTime = new Subject<number>();

  /** Get the [[IBApi]] object. */
  get api(): IBApi {
    return this.ib;
  }

  /** Get an [[Observable]] to observe the connection-state. */
  get connectionState(): Observable<ConnectionState> {
    return this._connectionState;
  }

  /** Get an [[Observable]] to observe error messages.*/
  get error(): Observable<IBApiError> {
    return this._error;
  }

  /**
   * Connect to the TWS or IB Gateway.
   *
   * @param reconnectInterval The re-connection interval in ms,
   * or undefined if automatic re-connection is disabled.
   *
   * Use [[connectionState]] for observing the connection state.
   */
  connect(reconnectInterval?: number): void {
    if (this._connectionState.getValue() === ConnectionState.Disconnected) {
      this._connectionState.next(ConnectionState.Connecting);
      this.reconnectInterval = reconnectInterval;
      this.ib.connect();
    } else {
      console.warn(
        "IBApiAutoConnection: connect() ignored - not in disconnected state."
      );
    }
  }

  /**
   * Disconnect from the TWS or IB Gateway.
   *
   * Use [[connectionState]] for observing the connection state.
   */
  disconnect(): void {
    if (this._connectionState.getValue() !== ConnectionState.Disconnected) {
      delete this.reconnectInterval;
      this.ib.disconnect();
    } else {
      console.warn(
        "IBApiAutoConnection: disconnect() ignored - already in disconnected state."
      );
    }
  }

  /**
   * Requests TWS's current time.
   */
  reqCurrentTime(): Promise<number> {
    return this._currentTime.asObservable().toPromise();
  }

  /**
   * Called when [[EventName.connected]] event has been received.
   */
  private onConnected() {
    console.debug("IBApiAutoConnection: onConnected");

    // verify state but and signal ConnectionState.Connected

    if (this._connectionState.getValue() !== ConnectionState.Connecting) {
      return;
    }

    this._connectionState.next(ConnectionState.Connected);

    // cancel reconnect

    if (this.reconnectionTimeout) {
      clearInterval(this.reconnectionTimeout);
      delete this.reconnectionTimeout;
    }

    // run connection watchdog

    delete this.lastCurrentTimeTm;
    let lastReqCurrentTimeTm = Date.now();
    this.ib.reqCurrentTime();

    this.connectionWatchdogTimeout = setInterval(() => {
      // check if we have received a timestamp since last run (+ some jitter)
      if (
        this.lastCurrentTimeTm === undefined ||
        lastReqCurrentTimeTm - this.lastCurrentTimeTm >
          IBApiAutoConnection.CONNECTION_WATCHDOG_INTERVAL + 10
      ) {
        // dead connection
        this.ib.disconnect();
        this.onDisconnected();
        return;
      }
      // request new TWS time
      lastReqCurrentTimeTm = Date.now();
      this.ib.reqCurrentTime();
    }, IBApiAutoConnection.CONNECTION_WATCHDOG_INTERVAL);
  }

  /**
   * Called when an [[EventName.error]] event has been received,
   * or the connection-watchdog has detected a dead connection.
   */
  private onError(error: Error, code: ErrorCode, reqId: number) {
    console.error(
      `IBApiAutoConnection: onError(${error.message}, ${code}, ${reqId})`
    );
    if (code === ErrorCode.CONNECT_FAIL) {
      this.onDisconnected();
    }
    this._error.next({ error, code, reqId });
  }

  /**
   * Called when an [[EventName.disconnected]] event has been received,
   * or the connection-watchdog has detected a dead connection.
   */
  private onDisconnected() {
    console.debug("IBApiAutoConnection: onDisconnected");

    // verify state and signal update

    if (this._connectionState.getValue() === ConnectionState.Disconnected) {
      return;
    }

    this._connectionState.next(ConnectionState.Disconnected);

    // stop connection watchdog

    if (this.connectionWatchdogTimeout) {
      clearInterval(this.connectionWatchdogTimeout);
      delete this.connectionWatchdogTimeout;
    }

    // initiate reconnection

    if (
      this.reconnectInterval !== undefined &&
      this.reconnectionTimeout === undefined
    ) {
      console.debug(
        `IBApiAutoConnection: reconnecting in ${
          this.reconnectInterval / 1000
        }s...`
      );
      this.reconnectionTimeout = setTimeout(() => {
        if (this.reconnectionTimeout !== undefined) {
          clearInterval(this.reconnectionTimeout);
          delete this.reconnectionTimeout;
        }
        this.connect(this.reconnectInterval);
      }, this.reconnectInterval);
    }
  }

  /**
   * Called when [[EventName.currentTime]] event has been received.
   *
   * This function needs to be called at least once per [[IBApi.CONNECTION_WATCHDOG_INTERVAL]],
   * or the connection-watchdog will signal a connection loss.
   */
  private onCurrentTime(time: number) {
    this.lastCurrentTimeTm = Date.now();
    this._currentTime.next(time);
  }
}
