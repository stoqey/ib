import { Contract } from "..";
import { EventName, IBApi, IBApiCreationOptions } from "../api/api";
import { Observable, Subject, Subscription } from "rxjs";
import { ConnectionState, IBApiAutoConnection } from "./api-auto-connection";

/**
 * @internal
 *
 * Returns undefined is the value is Number.MAX_VALUE, or the value otherwise.
 */
function undefineMax(v: number): number | undefined {
  return v === Number.MAX_VALUE ? undefined : v;
}

/**
 * @internal
 *
 * Internal helper to generate unique request ids.
 */
class RequestId {
  private static _current = 1;
  static next(): number {
    return ++this._current;
  }
}

/**
 * @internal
 *
 * A subscription on the [[IBApiNext]] object.
 */
class IBApiNextSubscription<T> {
  /**
   * Create a [[IBApiNextSubscription]] object.
   *
   * @param requestFunction
   * @param cancelFunction
   */
  constructor(
    private api: IBApi,
    private requestFunction: () => void,
    private cancelFunction: () => void,
    private eventHandler: (result: (v: T) => void) => void
  ) {
    this.eventHandler((v) => this.next(v));
  }

  /** Number of active observers. */
  private observers = 0;

  /** The cached data. */
  private cache?: T;

  /** The inner [[Subject]]. */
  private readonly subject = new Subject<T>();

  /** Create an Observable the subscription. */
  observable(): Observable<T> {
    if (!this.observers && this.api.isConnected) {
      this.requestFunction();
    }
    this.observers++;
    return new Observable<T>((subscriber) => {
      const sub$ = this.subject.subscribe((v) => subscriber.next(v));
      return (): void => {
        sub$.unsubscribe();
        this.observers--;
        if (this.observers <= 0 && this.api.isConnected) {
          this.cancelFunction();
        }
      };
    });
  }

  /** Get the current value. */
  get value(): T | undefined {
    return this.cache;
  }

  /** Post the next value to the subject. */
  next(v: T): void {
    this.cache = v;
    this.subject.next(v);
  }

  /** Refresh the request on TWS API if there are active subscribers. */
  refresh(): void {
    if (this.observers && this.api.isConnected) {
      this.requestFunction();
    }
  }
}

/** A position as returned by [[IBApiNext]]. */
export interface Position {
  /** The account holding the position. */
  account: string;

  /** The position's [[Contract]] */
  contract: Contract;

  /** The number of positions held. */
  pos: number;

  /** The average cost of the position. */
  avgCost: number;
}

/** Account PnL as returned by [[IBApiNext]]. */
export interface PnL {
  /** The daily PnL. */
  dailyPnL?: number;

  /** The daily unrealized PnL. */
  unrealizedPnL?: number;

  /** The daily realized PnL. */
  realizedPnL?: number;
}

/** Positions PnL as returned by [[IBApiNext]]. */
export interface PnLSingle extends PnL {
  /** Current size of the position. */
  pos?: number;

  /** The current market value of the position. */
  value?: number;
}

/**
 * This extends [[IBApiAutoConnection]] and implements
 * rxjs wrappers for request/event functions of [[IBApi]].
 */
export class IBApiNext extends IBApiAutoConnection {
  /**
   * Create an [[IBApiNext]] object.
   *
   * @param options [[IBApi]] creation options.
   */
  constructor(options?: IBApiCreationOptions) {
    super(options);
  }

  /** Subscription on the connection state.  */
  private connectionState$?: Subscription;

  /** Map of pnl subscriptions, with "<account>:<modelCode>" is key.  */
  private readonly _pnl = new Map<string, IBApiNextSubscription<PnL>>();

  /** Map of pnl subscriptions, with "<account>:<modelCode>:<conId>" is key.  */
  private readonly _pnlSingle = new Map<
    string,
    IBApiNextSubscription<PnLSingle>
  >();

  /** The positions subscription.  */
  private _positions?: IBApiNextSubscription<Position[]>;

  /** Refresh all subscriptions */
  private refreshSubscriptions() {
    if (this.api.isConnected) {
      this._pnl.forEach((s) => s.refresh());
      this._pnlSingle.forEach((s) => s.refresh());
      this._positions?.refresh();
    }
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
    if (!this.connectionState$) {
      this.connectionState$ = this.connectionState.subscribe((state) => {
        if (state === ConnectionState.Connected) {
          this.refreshSubscriptions();
        }
      });
    }
    super.connect(reconnectInterval);
  }

  /**
   * Disconnect from the TWS or IB Gateway.
   *
   * Use [[connectionState]] for observing the connection state.
   */
  disconnect(): void {
    this.connectionState$?.unsubscribe();
    delete this.connectionState$;
    super.disconnect();
  }

  /**
   * Get an Observable to receive real time daily PnL and unrealized PnL updates.
   *
   * @see [[IBApi.reqPnL]]
   * @see [[IBApi.cancelPnL]]
   */
  getPnL(account: string, modelCode?: string | null): Observable<PnL> {
    // check there is a subscription already

    const key = `${account}:${modelCode}`;
    let subscription = this._pnl.get(key);
    if (subscription) {
      return subscription.observable();
    }

    // create new subscription

    const reqId = RequestId.next();

    subscription = new IBApiNextSubscription<PnL>(
      this.api,
      () => this.api.reqPnL(reqId, account, modelCode),
      () => this.api.cancelPnL(reqId),
      (result) => {
        this.api.on(
          EventName.pnl,
          (id, dailyPnL, unrealizedPnL, realizedPnL) => {
            if (id === reqId) {
              result({
                dailyPnL: undefineMax(dailyPnL),
                unrealizedPnL: undefineMax(unrealizedPnL),
                realizedPnL: undefineMax(realizedPnL),
              });
            }
          }
        );
      }
    );

    this._pnl.set(key, subscription);

    // return observable

    return subscription.observable();
  }

  /**
   * Get an Observable to receive real time updates for daily PnL of individual positions.
   *
   * @see [[IBApi.reqPnLSingle]]
   * @see [[IBApi.cancelPnLSingle]]
   */
  getPnLSingle(
    account: string,
    modelCode: string | null,
    conId: number
  ): Observable<PnLSingle> {
    // check there is a subscription already

    const key = `${account}:${modelCode}:${conId}`;
    let subscription = this._pnlSingle.get(key);
    if (subscription) {
      return subscription.observable();
    }

    // create new subscription

    const reqId = RequestId.next();

    subscription = new IBApiNextSubscription<PnLSingle>(
      this.api,
      () => this.api.reqPnLSingle(reqId, account, modelCode, conId),
      () => this.api.cancelPnLSingle(reqId),
      (result) => {
        this.api.on(
          EventName.pnlSingle,
          (id, pos, dailyPnL, unrealizedPnL, realizedPnL, value) => {
            if (id === reqId) {
              result({
                pos: undefineMax(pos),
                dailyPnL: undefineMax(dailyPnL),
                unrealizedPnL: undefineMax(unrealizedPnL),
                realizedPnL: undefineMax(realizedPnL),
                value: undefineMax(value),
              });
            }
          }
        );
      }
    );

    this._pnlSingle.set(key, subscription);

    // return observable

    return subscription.observable();
  }

  /**
   * Get an Observable to receive the positions for all accessible accounts.
   *
   * @see [[IBApi.reqPositions]]
   * @see [[IBApi.cancelPositions]]
   */
  getPositions(): Observable<Position[]> {
    // check there is a subscription already

    if (this._positions) {
      return this._positions.observable();
    }

    // create new subscription

    let syncedPositions: Position[] | undefined;

    this._positions = new IBApiNextSubscription<Position[]>(
      this.api,
      () => {
        syncedPositions = [];
        this.api.reqPositions();
      },
      () => {
        this.api.cancelPositions();
      },
      (result) => {
        // handle position events

        this.api.on(EventName.position, (account, contract, pos, avgCost) => {
          // initial position sync

          if (syncedPositions) {
            syncedPositions.push({
              account,
              contract,
              pos,
              avgCost,
            });
            return;
          }

          // update or remove position

          const positions = this._positions?.value;
          if (positions === undefined) {
            return;
          }

          let updated = false;

          for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            if (p.account == account && p.contract.conId == contract.conId) {
              if (!pos) {
                // remove zero size position
                positions.splice(i);
              } else {
                // update position
                p.contract = contract;
                p.pos = pos;
                p.avgCost = avgCost;
              }
              updated = true;
              break;
            }
          }

          // add position

          if (!updated) {
            positions.push({ account, contract, pos, avgCost });
          }

          // deliver result

          result(positions);
        });

        // handle positionEnd event

        this.api.on(EventName.positionEnd, () => {
          if (syncedPositions) {
            this._positions?.next(syncedPositions);
          }
          syncedPositions = undefined;
        });
      }
    );

    // return observable

    return this._positions.observable();
  }
}
