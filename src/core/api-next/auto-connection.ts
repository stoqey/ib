import { BehaviorSubject, Observable } from "rxjs";
import IBApi, {
  ConnectionState,
  ErrorCode,
  EventName,
  IBApiCreationOptions,
} from "../..";
import { Logger } from "../../api-next/common/logger";

/** The log tag. */
const LOG_TAG = "IBApiAutoConnection";

/**
 * @internal
 *
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
   * Use 0 to disable auto re-connect.
   * @param options [[IBApi]] Creation options.
   * @param logger The [[IBApiNextLogger]] logger instance ot receive log messages
   */
  constructor(
    public readonly reconnectInterval: number,
    private readonly logger: Logger,
    public readonly options?: IBApiCreationOptions
  ) {
    super(options);
    this.on(EventName.connected, () => this.onConnected());
    this.on(EventName.disconnected, () => this.onDisconnected());
    this.on(EventName.received, () => (this.lastDataIngressTm = Date.now()));
    this.on(EventName.error, (error, code, reqId) => {
      this.logger.error(
        "TWS",
        `${error.message} - Code: ${code} - ReqId: ${reqId}`
      );
      if (code === ErrorCode.CONNECT_FAIL) {
        this.onDisconnected();
      }
    });
    this.on(EventName.currentTime, () => (this.lastDataIngressTm = Date.now()));
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
  private reconnectionTimeout?: ReturnType<typeof setTimeout>;

  /** The connection-watchdog timeout. */
  private connectionWatchdogTimeout?: ReturnType<typeof setTimeout>;

  /** Ingress timestamp of last received message data from TWS. */
  private lastDataIngressTm?: number;

  /** The connection-state [[BehaviorSubject]]. */
  private readonly _connectionState = new BehaviorSubject<ConnectionState>(
    ConnectionState.Disconnected
  );

  /** Get the connection-state as an [[Observable]]. */
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
      (clientId === undefined ? this.options?.clientId : clientId) ??
      Math.floor(Math.random() * 100) + 1;
    if (this._connectionState.getValue() === ConnectionState.Disconnected) {
      this._connectionState.next(ConnectionState.Connecting);
      this.logger.info(
        LOG_TAG,
        `Connecting to TWS with client id ${this.currentClientId}`
      );
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
      this.logger.info(
        LOG_TAG,
        `Disconnecting client id ${this.currentClientId} from TWS.`
      );
      this._connectionState.next(ConnectionState.Disconnected);
      if (this.isConnected) {
        super.disconnect();
      }
    }
    return this;
  }

  /**
   * Called when [[EventName.connected]] event has been received.
   */
  private onConnected(): void {
    if (this._connectionState.getValue() !== ConnectionState.Connected) {
      // signal connect state

      this._connectionState.next(ConnectionState.Connected);
      this.logger.info(
        LOG_TAG,
        `Successfully connected to TWS with client id ${this.currentClientId}.`
      );

      // cancel reconnect timer and run the connection watchdog

      this.stopReConnectTimer();
      this.runWatchdog();
    }
  }

  /**
   * Re-establish the connection.
   */
  private reConnect(): void {
    // verify and update state
    if (
      this._connectionState.getValue() !== ConnectionState.Disconnected ||
      !this.autoReconnectEnabled
    ) {
      return;
    }

    this._connectionState.next(ConnectionState.Connecting);

    // connect to IB

    this.currentClientId =
      this.fixedClientId !== undefined
        ? this.fixedClientId
        : this.currentClientId + 1;

    this.logger.info(
      LOG_TAG,
      `Re-Connecting to TWS with client id ${this.currentClientId}`
    );

    super.disconnect();
    super.connect(this.currentClientId);
  }

  /**
   * Start the re-connection timer.
   */
  private runReConnectTimer(): void {
    // verify state
    if (!this.reconnectInterval || !this.autoReconnectEnabled) {
      return;
    }

    this.logger.info(
      LOG_TAG,
      `Re-Connecting to TWS in ${this.reconnectInterval / 1000}s...`
    );

    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
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

    this.logger.debug(
      LOG_TAG,
      `Starting connection watchdog with ${this.CONNECTION_WATCHDOG_INTERVAL}ms interval.`
    );

    this.connectionWatchdogTimeout = setInterval(() => {
      let triggerReconnect = false;
      if (this.lastDataIngressTm === undefined) {
        triggerReconnect = true;
      } else {
        const elapsed = Date.now() - this.lastDataIngressTm;
        if (elapsed > this.CONNECTION_WATCHDOG_INTERVAL) {
          triggerReconnect = true;
        }
      }
      if (triggerReconnect) {
        this.logger.debug(
          LOG_TAG,
          "Connection watchdog timeout. Dropping connection."
        );
        this.onDisconnected();
      }
      // trigger at least some message if connection is idle
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
    this.logger.debug(LOG_TAG, "onDisconnected()");

    // verify state and update state
    if (this.isConnected) {
      this.logger.debug(
        LOG_TAG,
        `Disconnecting client id ${this.currentClientId} from TWS (state-sync).`
      );
      this.disconnect();
      this.autoReconnectEnabled = true;
    }

    if (this._connectionState.getValue() !== ConnectionState.Disconnected) {
      this._connectionState.next(ConnectionState.Disconnected);
    }

    // stop watch and run re-connect timer

    this.stopWatchdog();
    this.runReConnectTimer();
  }
}
