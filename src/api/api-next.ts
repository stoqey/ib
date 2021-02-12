import {
  IBApi,
  IBApiCreationOptions,
  EventName,
  Contract,
  TickType as IBApiTickType,
  ContractDetails,
} from "..";
import { Observable, Subject, Subscription } from "rxjs";
import { ConnectionState, IBApiAutoConnection } from "./api-auto-connection";

/**
 * @internal
 *
 * Returns undefined is the value is Number.MAX_VALUE, or the value otherwise.
 */
function undefineMax(v: number | undefined): number | undefined {
  return v === undefined || v === Number.MAX_VALUE ? undefined : v;
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
 * Interface on an [[IBApiNext]] subject.
 */
interface IBApiNextSubject<T> {
  next(v: T, cache?: boolean): void;
  cache(v: T): void;
  cached(): T | undefined;
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
   * @param requestFunction Function called to start the request to [[IBApi]].
   * @param cancelFunction Function called to cancel the request to [[IBApi]].
   * @param eventHandler Function called to setup the event handler on [[IBApi]].
   * @param cleanupFunction Function called for clean up, after last observer has unsubscribed.
   */
  constructor(
    private api: IBApi,
    private requestFunction: () => void,
    private cancelFunction: () => void,
    private eventHandler: (subject: IBApiNextSubject<T>) => void,
    private cleanupFunction: () => void
  ) {
    this.eventHandler({
      next: (v, cache) => this.next(v, cache),
      cache: (v) => (this.cache = v),
      cached: () => this.cache,
    });
  }

  /** Number of active observers. */
  private observers = 0;

  /** The cached data. */
  private cache?: T;

  /** The inner [[Subject]]. */
  private readonly subject = new Subject<T>();

  /**
   * Create an Observable on the subscription.
   */
  observable(): Observable<T> {
    if (!this.observers && this.api.isConnected) {
      this.requestFunction();
    }
    this.observers++;
    return new Observable<T>((subscriber) => {
      if (this.cache !== undefined) {
        subscriber.next(this.cache);
      }
      const sub$ = this.subject.subscribe((v) => subscriber.next(v));
      return (): void => {
        sub$.unsubscribe();
        this.observers--;
        if (this.observers <= 0) {
          if (this.api.isConnected) {
            this.cancelFunction();
          }
          this.cleanupFunction();
        }
      };
    });
  }

  /** Get the current value. */
  get value(): T | undefined {
    return this.cache;
  }

  /**
   * Post the next value to the subject.
   *
   * @param v: Next value.
   * @param cache: if false, the value will not be cached.
   * Use this when you only want to post an update, but cache a full set of values (example: market data).
   */
  next(v: T, cache?: boolean): void {
    if (cache !== false) {
      this.cache = v;
    }
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
  position?: number;

  /** The current market value of the position. */
  value?: number;
}

/** Market data tick types added by [[IBApiNext]]. */
export enum IBApiNextTickType {
  OPTION_PV_DIVIDEND = 10000,
  OPTION_UNDERLYING,
  BID_OPTION_IV,
  BID_OPTION_PRICE,
  BID_OPTION_DELTA,
  BID_OPTION_GAMMA,
  BID_OPTION_VEGA,
  BID_OPTION_THETA,
  DELAYED_BID_OPTION_IV,
  DELAYED_BID_OPTION_PRICE,
  DELAYED_BID_OPTION_DELTA,
  DELAYED_BID_OPTION_GAMMA,
  DELAYED_BID_OPTION_VEGA,
  DELAYED_BID_OPTION_THETA,
  ASK_OPTION_IV,
  ASK_OPTION_PRICE,
  ASK_OPTION_DELTA,
  ASK_OPTION_GAMMA,
  ASK_OPTION_VEGA,
  ASK_OPTION_THETA,
  DELAYED_ASK_OPTION_IV,
  DELAYED_ASK_OPTION_PRICE,
  DELAYED_ASK_OPTION_DELTA,
  DELAYED_ASK_OPTION_GAMMA,
  DELAYED_ASK_OPTION_VEGA,
  DELAYED_ASK_OPTION_THETA,
  LAST_OPTION_IV,
  LAST_OPTION_PRICE,
  LAST_OPTION_DELTA,
  LAST_OPTION_GAMMA,
  LAST_OPTION_VEGA,
  LAST_OPTION_THETA,
  DELAYED_LAST_OPTION_IV,
  DELAYED_LAST_OPTION_PRICE,
  DELAYED_LAST_OPTION_DELTA,
  DELAYED_LAST_OPTION_GAMMA,
  DELAYED_LAST_OPTION_VEGA,
  DELAYED_LAST_OPTION_THETA,
  MODEL_OPTION_IV,
  MODEL_OPTION_PRICE,
  MODEL_OPTION_DELTA,
  MODEL_OPTION_GAMMA,
  MODEL_OPTION_VEGA,
  MODEL_OPTION_THETA,
  DELAYED_MODEL_OPTION_IV,
  DELAYED_MODEL_OPTION_PRICE,
  DELAYED_MODEL_OPTION_DELTA,
  DELAYED_MODEL_OPTION_GAMMA,
  DELAYED_MODEL_OPTION_VEGA,
  DELAYED_MODEL_OPTION_THETA,
}

/** All market data tick types as supported by [[IBApiNext]]. */
export type TickTypeNext = IBApiTickType | IBApiNextTickType;

/** A market data tick on [[IBApiNext]]. */
export interface MarketData {
  ticks: Map<TickTypeNext, number>;
}

/** An account summary value on [[IBApiNext]]. */
export interface AccountSummaryValue {
  value: string;
  currency: string;
}

/** An account summary on [[IBApiNext]]. */
export interface AccountSummary {
  account: string;
  values: Map<string, AccountSummaryValue>;
}

/**
 * This class extends [[IBApiAutoConnection]] and implements
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

  /** The positions subscription.  */
  private _positions?: IBApiNextSubscription<Position[]>;

  /** Map of pnl subscriptions, with "<account>:<modelCode>" is key.  */
  private readonly _pnl = new Map<string, IBApiNextSubscription<PnL>>();

  /** Map of pnl subscriptions, with "<account>:<modelCode>:<conId>" is key.  */
  private readonly _pnlSingle = new Map<
    string,
    IBApiNextSubscription<PnLSingle>
  >();

  /** The contract details subscriptions.  */
  private readonly _contractDetails = new Map<
    Contract,
    IBApiNextSubscription<ContractDetails[]>
  >();

  /** Map of account summary subscriptions, with "<group>:<tags>" is key.  */
  private readonly _accountSummaries = new Map<
    string,
    IBApiNextSubscription<AccountSummary>
  >();

  /** Refresh all subscriptions */
  private refreshSubscriptions() {
    if (this.api.isConnected) {
      this._positions?.refresh();
      this._pnl.forEach((s) => s.refresh());
      this._pnlSingle.forEach((s) => s.refresh());
      this._contractDetails.forEach((s) => s.refresh());
      this._accountSummaries.forEach((s) => s.refresh());
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
   * Get an Observable to receive a specific account's summary.
   * This method will subscribe to the account summary as presented in the TWS' Account Summary tab.
   * The data is emitted as accountSummary event.
   *
   * https://www.interactivebrokers.com/en/software/tws/accountwindowtop.htm
   *
   * @param group Set to "All" to return account summary data for all accounts,
   * or set to a specific Advisor Account Group name that has already been created in TWS Global Configuration.
   * @param tags A comma separated list with the desired tags:
   * - AccountType — Identifies the IB account structure
   * - NetLiquidation — The basis for determining the price of the assets in your account. Total cash value + stock value + options value + bond value
   * - TotalCashValue — Total cash balance recognized at the time of trade + futures PNL
   * - SettledCash — Cash recognized at the time of settlement - purchases at the time of trade - commissions - taxes - fees
   * - AccruedCash — Total accrued cash value of stock, commodities and securities
   * - BuyingPower — Buying power serves as a measurement of the dollar value of securities that one may purchase in a securities account without depositing additional funds
   * - EquityWithLoanValue — Forms the basis for determining whether a client has the necessary assets to either initiate or maintain security positions. Cash + stocks + bonds + mutual funds
   * - PreviousEquityWithLoanValue — Marginable Equity with Loan value as of 16:00 ET the previous day
   * - GrossPositionValue — The sum of the absolute value of all stock and equity option positions
   * - RegTEquity — Regulation T equity for universal account
   * - RegTMargin — Regulation T margin for universal account
   * - SMA — Special Memorandum Account: Line of credit created when the market value of securities in a Regulation T account increase in value
   * - InitMarginReq — Initial Margin requirement of whole portfolio
   * - MaintMarginReq — Maintenance Margin requirement of whole portfolio
   * - AvailableFunds — This value tells what you have available for trading
   * - ExcessLiquidity — This value shows your margin cushion, before liquidation
   * - Cushion — Excess liquidity as a percentage of net liquidation value
   * - FullInitMarginReq — Initial Margin of whole portfolio with no discounts or intraday credits
   * - FullMaintMarginReq — Maintenance Margin of whole portfolio with no discounts or intraday credits
   * - FullAvailableFunds — Available funds of whole portfolio with no discounts or intraday credits
   * - FullExcessLiquidity — Excess liquidity of whole portfolio with no discounts or intraday credits
   * - LookAheadNextChange — Time when look-ahead values take effect
   * - LookAheadInitMarginReq — Initial Margin requirement of whole portfolio as of next period's margin change
   * - LookAheadMaintMarginReq — Maintenance Margin requirement of whole portfolio as of next period's margin change
   * - LookAheadAvailableFunds — This value reflects your available funds at the next margin change
   * - LookAheadExcessLiquidity — This value reflects your excess liquidity at the next margin change
   * - HighestSeverity — A measure of how close the account is to liquidation
   * - DayTradesRemaining — The Number of Open/Close trades a user could put on before Pattern Day Trading is detected. A value of "-1" means that the user can put on unlimited day trades.
   * - Leverage — GrossPositionValue / NetLiquidation
   * - $LEDGER — Single flag to relay all cash balance tags*, only in base currency.
   * - $LEDGER:CURRENCY — Single flag to relay all cash balance tags*, only in the specified currency.
   * - $LEDGER:ALL — Single flag to relay all cash balance tags* in all currencies.
   *
   * @see [[cancelAccountSummary]]
   */
  getAccountSummary(group: string, tags: string): Observable<AccountSummary> {
    const key = `${group}:${tags}`;

    // check there is a subscription already

    let subscription = this._accountSummaries.get(key);
    if (subscription) {
      return subscription.observable();
    }

    // create new subscription

    const reqId = RequestId.next();
    let onAccountSummary: (
      id: number,
      account: string,
      tag: string,
      value: string,
      currency: string
    ) => void;

    subscription = new IBApiNextSubscription<AccountSummary>(
      this.api,
      () => this.api.reqAccountSummary(reqId, group, tags),
      () => this.api.cancelAccountSummary(reqId),
      (subject) => {
        onAccountSummary = (id, account, tag, value, currency) => {
          if (id === reqId) {
            const cached: AccountSummary = subject.cached() ?? {
              account,
              values: new Map(),
            };
            cached.values.set(tag, { value, currency });
            subject.cache(cached);
            subject.next(
              {
                account,
                values: new Map([[tag, { value, currency }]]),
              },
              false
            );
          }
        };

        this.api.addListener(EventName.accountSummary, onAccountSummary);
      },
      () => {
        this.api.removeListener(EventName.accountSummary, onAccountSummary);
        this._accountSummaries.delete(key);
      }
    );

    this._accountSummaries.set(key, subscription);

    // return observable

    return subscription.observable();
  }

  /**
   * Get an Observable to receive real time daily PnL and unrealized PnL updates.
   *
   * @param account Account for which to receive PnL updates.
   * @param modelCode Specify to request PnL updates for a specific model.
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
    let onPnL: (
      id: number,
      dailyPnL: number,
      unrealizedPnL: number,
      realizedPnL: number
    ) => void;

    subscription = new IBApiNextSubscription<PnL>(
      this.api,
      () => this.api.reqPnL(reqId, account, modelCode),
      () => this.api.cancelPnL(reqId),
      (subject) => {
        onPnL = (id, dailyPnL, unrealizedPnL, realizedPnL) => {
          if (id === reqId) {
            subject.next({
              dailyPnL: undefineMax(dailyPnL),
              unrealizedPnL: undefineMax(unrealizedPnL),
              realizedPnL: undefineMax(realizedPnL),
            });
          }
        };
        this.api.addListener(EventName.pnl, onPnL);
      },
      () => {
        this.api.removeListener(EventName.pnl, onPnL);
        this._pnl.delete(key);
      }
    );

    this._pnl.set(key, subscription);

    // return observable

    return subscription.observable();
  }

  /**
   * Get an Observable to receive real time updates for daily PnL of individual positions.
   *
   * @param account Account in which position exists.
   * @param modelCode Model in which position exists.
   * @param conId Contract ID (conId) of contract to receive daily PnL updates for.
   * Note: does not return a result if an invalid conId is entered.
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
    let onPnlSingle: (
      id: number,
      pos: number,
      dailyPnL: number,
      unrealizedPnL: number,
      realizedPnL: number,
      value: number
    ) => void;

    subscription = new IBApiNextSubscription<PnLSingle>(
      this.api,
      () => this.api.reqPnLSingle(reqId, account, modelCode, conId),
      () => this.api.cancelPnLSingle(reqId),
      (subject) => {
        onPnlSingle = (
          id,
          pos,
          dailyPnL,
          unrealizedPnL,
          realizedPnL,
          value
        ) => {
          if (id === reqId) {
            subject.next({
              position: undefineMax(pos),
              dailyPnL: undefineMax(dailyPnL),
              unrealizedPnL: undefineMax(unrealizedPnL),
              realizedPnL: undefineMax(realizedPnL),
              value: undefineMax(value),
            });
          }
        };
        this.api.addListener(EventName.pnlSingle, onPnlSingle);
      },
      () => {
        this.api.removeListener(EventName.pnlSingle, onPnlSingle);
        this._pnlSingle.delete(key);
      }
    );

    this._pnlSingle.set(key, subscription);

    // return observable

    return subscription.observable();
  }

  /**
   * Get an Observable to receive the positions for all accessible accounts.
   * Initially all positions are returned and then updates are returned for any position changes in real time.
   *
   * @param account If an account Id is provided, only the account's positions belonging to the specified model will be delivered.
   * @param modelCode The code of the model's positions we are interested in.
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

    let onPosition: (
      account: string,
      contract: Contract,
      pos: number,
      avgCost: number
    ) => void;
    let onPositionEnd: () => void;

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
      (subject) => {
        // handle position events

        onPosition = (account, contract, pos, avgCost) => {
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

          subject.next(positions);
        };

        // handle positionEnd event

        onPositionEnd = () => {
          if (syncedPositions) {
            this._positions?.next(syncedPositions);
          }
          syncedPositions = undefined;
        };

        this.api.addListener(EventName.position, onPosition);
        this.api.addListener(EventName.positionEnd, onPositionEnd);
      },
      () => {
        this.api.removeListener(EventName.position, onPosition);
        this.api.removeListener(EventName.positionEnd, onPositionEnd);
        delete this._positions;
      }
    );

    // return observable

    return this._positions.observable();
  }

  /**
   * Get an Observable to receive contract information.
   * This method will provide all the contracts matching the contract provided.
   *
   * It can also be used to retrieve complete options and futures chains.
   * Though it is now (in API version > 9.72.12) advised to use reqSecDefOptParams for that purpose.
   *
   * This information will be emitted as contractDetails event.
   *
   * @param contract The contract used as sample to query the available contracts.
   *
   * @see [[IBApi.reqContractDetails]]
   */
  getContractDetails(contract: Contract): Observable<ContractDetails[]> {
    // check there is a subscription already

    let subscription = this._contractDetails.get(contract);
    if (subscription) {
      return subscription.observable();
    }

    // create subscription

    const reqId = RequestId.next();
    let onContractDetails: (id: number, details: ContractDetails) => void;
    let onContractDetailsEnd: (id: number) => void;

    subscription = new IBApiNextSubscription<ContractDetails[]>(
      this.api,
      () => this.api.reqContractDetails(reqId, contract),
      () => {
        return;
      },
      (subject) => {
        const all: ContractDetails[] = [];

        onContractDetails = (id: number, details: ContractDetails): void => {
          if (id === reqId) {
            all.push(details);
          }
        };

        onContractDetailsEnd = (id: number): void => {
          if (id === reqId) {
            subject.next(all);
          }
        };

        this.api.addListener(EventName.contractDetails, onContractDetails);
        this.api.addListener(
          EventName.contractDetailsEnd,
          onContractDetailsEnd
        );
      },
      () => {
        this.api.removeListener(EventName.contractDetails, onContractDetails);
        this.api.removeListener(
          EventName.contractDetailsEnd,
          onContractDetailsEnd
        );
        this._contractDetails.delete(contract);
      }
    );

    this._contractDetails.set(contract, subscription);

    // return observable

    return subscription.observable();
  }

  /** The positions subscriptions.  */
  private readonly _marketData = new Map<
    string,
    IBApiNextSubscription<MarketData>
  >();

  /**
   * Get an Observable to receive real time market data.
   * Returns market data for an instrument either in real time or 10-15 minutes delayed (depending on the market data type specified).
   *
   * @param contract The [[Contract]] for which the data is being requested
   * @param genericTickList comma  separated ids of the available generic ticks:
   * - 100 Option Volume (currently for stocks)
   * - 101 Option Open Interest (currently for stocks)
   * - 104 Historical Volatility (currently for stocks)
   * - 105 Average Option Volume (currently for stocks)
   * - 106 Option Implied Volatility (currently for stocks)
   * - 162 Index Future Premium
   * - 165 Miscellaneous Stats
   * - 221 Mark Price (used in TWS P&L computations)
   * - 225 Auction values (volume, price and imbalance)
   * - 233 RTVolume - contains the last trade price, last trade size, last trade time, total volume, VWAP, and single trade flag.
   * - 236 Shortable
   * - 256 Inventory
   * - 258 Fundamental Ratios
   * - 411 Realtime Historical Volatility
   * - 456 IBDividends
   * @param snapshot For users with corresponding real time market data subscriptions.
   * A `true` value will return a one-time snapshot, while a `false` value will provide streaming data.
   * @param regulatorySnapshot Snapshot for US stocks requests NBBO snapshots for users which have "US Securities Snapshot Bundle" subscription
   * but not corresponding Network A, B, or C subscription necessary for streaming * market data.
   * One-time snapshot of current market price that will incur a fee of 1 cent to the account per snapshot.
   *
   * @see [[IBApi.reqMktData]]
   * @see [[IBApi.cancelMktData]]
   */
  getMarketData(
    contract: Contract,
    genericTickList: string,
    snapshot: boolean,
    regulatorySnapshot: boolean
  ): Observable<MarketData> {
    const key = `${contract.conId}:${genericTickList}:${snapshot}:${regulatorySnapshot}`;

    // check there is a subscription already

    let subscription = this._marketData.get(key);
    if (subscription) {
      return subscription.observable();
    }

    // create subscription

    const tickerId = RequestId.next();
    let onTick: (id: number, tickType: IBApiTickType, value: number) => void;
    let onTickOptionComputation: (
      id: number,
      field: number,
      impliedVolatility: number,
      delta: number,
      optPrice: number,
      pvDividend: number,
      gamma: number,
      vega: number,
      theta: number,
      undPrice: number
    ) => void;

    subscription = new IBApiNextSubscription<MarketData>(
      this.api,
      () =>
        this.api.reqMktData(
          tickerId,
          contract,
          genericTickList,
          snapshot,
          regulatorySnapshot
        ),
      () => this.api.cancelMktData(tickerId),
      (subject) => {
        onTick = (id, tickType, v) => {
          if (id === tickerId) {
            const value = undefineMax(v);
            if (value !== undefined) {
              const cached = subject.cached() ?? {
                ticks: new Map(),
              };
              cached.ticks.set(tickType, value);
              subject.cache(cached);
              subject.next({ ticks: new Map([[tickType, value]]) }, false);
            }
          }
        };
        onTickOptionComputation = (
          id,
          field,
          impliedVolatility,
          delta,
          optPrice,
          pvDividend,
          gamma,
          vega,
          theta,
          undPrice
        ) => {
          if (id === tickerId) {
            const values: [TickTypeNext, number | undefined][] = [
              [IBApiNextTickType.OPTION_UNDERLYING, undPrice],
              [IBApiNextTickType.OPTION_PV_DIVIDEND, pvDividend],
            ];
            switch (field) {
              case IBApiTickType.BID_OPTION:
                values.push(
                  [IBApiNextTickType.BID_OPTION_IV, impliedVolatility],
                  [IBApiNextTickType.BID_OPTION_DELTA, delta],
                  [IBApiNextTickType.BID_OPTION_PRICE, optPrice],
                  [IBApiNextTickType.BID_OPTION_GAMMA, gamma],
                  [IBApiNextTickType.BID_OPTION_VEGA, vega],
                  [IBApiNextTickType.BID_OPTION_THETA, theta]
                );
                break;
              case IBApiTickType.DELAYED_BID_OPTION:
                values.push(
                  [IBApiNextTickType.DELAYED_BID_OPTION_IV, impliedVolatility],
                  [IBApiNextTickType.DELAYED_BID_OPTION_DELTA, delta],
                  [IBApiNextTickType.DELAYED_BID_OPTION_PRICE, optPrice],
                  [IBApiNextTickType.DELAYED_BID_OPTION_GAMMA, gamma],
                  [IBApiNextTickType.DELAYED_BID_OPTION_VEGA, vega],
                  [IBApiNextTickType.DELAYED_BID_OPTION_THETA, theta]
                );
                break;
              case IBApiTickType.ASK_OPTION:
                values.push(
                  [IBApiNextTickType.ASK_OPTION_IV, impliedVolatility],
                  [IBApiNextTickType.ASK_OPTION_DELTA, delta],
                  [IBApiNextTickType.ASK_OPTION_PRICE, optPrice],
                  [IBApiNextTickType.ASK_OPTION_GAMMA, gamma],
                  [IBApiNextTickType.ASK_OPTION_VEGA, vega],
                  [IBApiNextTickType.ASK_OPTION_THETA, theta]
                );
                break;
              case IBApiTickType.DELAYED_ASK_OPTION:
                values.push(
                  [IBApiNextTickType.DELAYED_ASK_OPTION_IV, impliedVolatility],
                  [IBApiNextTickType.DELAYED_ASK_OPTION_DELTA, delta],
                  [IBApiNextTickType.DELAYED_ASK_OPTION_PRICE, optPrice],
                  [IBApiNextTickType.DELAYED_ASK_OPTION_GAMMA, gamma],
                  [IBApiNextTickType.DELAYED_ASK_OPTION_VEGA, vega],
                  [IBApiNextTickType.DELAYED_ASK_OPTION_THETA, theta]
                );
                break;
              case IBApiTickType.LAST_OPTION:
                values.push(
                  [IBApiNextTickType.LAST_OPTION_IV, impliedVolatility],
                  [IBApiNextTickType.LAST_OPTION_DELTA, delta],
                  [IBApiNextTickType.LAST_OPTION_PRICE, optPrice],
                  [IBApiNextTickType.LAST_OPTION_GAMMA, gamma],
                  [IBApiNextTickType.LAST_OPTION_VEGA, vega],
                  [IBApiNextTickType.LAST_OPTION_THETA, theta]
                );
                break;
              case IBApiTickType.DELAYED_LAST_OPTION:
                values.push(
                  [IBApiNextTickType.DELAYED_LAST_OPTION_IV, impliedVolatility],
                  [IBApiNextTickType.DELAYED_LAST_OPTION_DELTA, delta],
                  [IBApiNextTickType.DELAYED_LAST_OPTION_PRICE, optPrice],
                  [IBApiNextTickType.DELAYED_LAST_OPTION_GAMMA, gamma],
                  [IBApiNextTickType.DELAYED_LAST_OPTION_VEGA, vega],
                  [IBApiNextTickType.DELAYED_LAST_OPTION_THETA, theta]
                );
                break;
              case IBApiTickType.MODEL_OPTION:
                values.push(
                  [IBApiNextTickType.MODEL_OPTION_IV, impliedVolatility],
                  [IBApiNextTickType.MODEL_OPTION_DELTA, delta],
                  [IBApiNextTickType.MODEL_OPTION_PRICE, optPrice],
                  [IBApiNextTickType.MODEL_OPTION_GAMMA, gamma],
                  [IBApiNextTickType.MODEL_OPTION_VEGA, vega],
                  [IBApiNextTickType.MODEL_OPTION_THETA, theta]
                );
                break;
              case IBApiTickType.DELAYED_MODEL_OPTION:
                values.push(
                  [
                    IBApiNextTickType.DELAYED_MODEL_OPTION_IV,
                    impliedVolatility,
                  ],
                  [IBApiNextTickType.DELAYED_MODEL_OPTION_DELTA, delta],
                  [IBApiNextTickType.DELAYED_MODEL_OPTION_PRICE, optPrice],
                  [IBApiNextTickType.DELAYED_MODEL_OPTION_GAMMA, gamma],
                  [IBApiNextTickType.DELAYED_MODEL_OPTION_VEGA, vega],
                  [IBApiNextTickType.DELAYED_MODEL_OPTION_THETA, theta]
                );
                break;
            }

            const cached = subject.cached() ?? {
              ticks: new Map(),
            };

            const filteredValues = new Map<TickTypeNext, number>();
            values.forEach((tick) => {
              const value = undefineMax(tick[1]);
              if (value !== undefined) {
                cached.ticks.set(tick[0], value);
                filteredValues.set(tick[0], value);
              }
            });

            subject.cache(cached);
            subject.next({ ticks: filteredValues });
          }
        };

        this.api.addListener(EventName.tickGeneric, onTick);
        this.api.addListener(EventName.tickPrice, onTick);
        this.api.addListener(EventName.tickSize, onTick);
        this.api.addListener(
          EventName.tickOptionComputation,
          onTickOptionComputation
        );
      },
      () => {
        this.api.removeListener(EventName.tickGeneric, onTick);
        this.api.removeListener(EventName.tickPrice, onTick);
        this.api.removeListener(EventName.tickSize, onTick);
        this.api.removeListener(
          EventName.tickOptionComputation,
          onTickOptionComputation
        );
        this._marketData.delete(key);
      }
    );

    this._marketData.set(key, subscription);

    // return observable

    return subscription.observable();
  }
}
