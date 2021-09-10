import { lastValueFrom, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import {
  Bar,
  Contract,
  ContractDetails,
  DepthMktDataDescription,
  DurationUnit,
  ErrorCode,
  EventName,
  HistogramEntry,
  HistoricalTick,
  HistoricalTickBidAsk,
  HistoricalTickLast,
  Order,
  OrderState,
} from "../";
import LogLevel from "../api/data/enum/log-level";
import {
  AccountSummaryValue,
  ConnectionState,
  IBApiNextError,
  IBApiTickType,
  MarketDataTick,
  MarketDataType,
  PnL,
  PnLSingle,
  AccountSummariesUpdate,
  AccountPositionsUpdate,
  Position,
  ContractDetailsUpdate,
  MarketDataUpdate,
  IBApiNextTickType,
} from "./";
import { ConsoleLogger } from "../core/api-next/console-logger";
import { Logger } from "./common/logger";
import { IBApiNextSubscription } from "../core/api-next/subscription";
import { IBApiNextSubscriptionRegistry } from "../core/api-next/subscription-registry";
import {
  MutableAccountSummaryTagValues,
  MutableAccountSummaryValues,
  MutableAccountSummaries,
} from "../core/api-next/api/account/mutable-account-summary";
import { MutableAccountPositions } from "../core/api-next/api/position/mutable-account-positions-update";
import { MutableMarketData } from "../core/api-next/api/market/mutable-market-data";
import { IBApiNextLogger } from "../core/api-next/logger";
import { IBApiAutoConnection } from "../core/api-next/auto-connection";
import { BarSizeSetting } from "../api/historical/bar-size-setting";
import { OpenOrder } from "./order/open-order";

/**
 * @internal
 *
 * An invalid request id.
 */
const INVALID_REQ_ID = -1;

/**
 * @internal
 *
 * Log tag used on messages created by IBApiNext.
 */
const LOG_TAG = "IBApiNext";

/**
 * @internal
 *
 * Log tag used on messages that have been received from TWS / IB Gateway.
 */
const TWS_LOG_TAG = "TWS";

/**
 * Input arguments on the [[IBApiNext]] constructor.
 */
export interface IBApiNextCreationOptions {
  /**
   * Hostname of the TWS (or IB Gateway).
   *
   * Default is 'localhost'.
   */
  host?: string;

  /**
   * Hostname of the TWS (or IB Gateway).
   *
   * Default is 7496, which is the default setting on TWS for live-accounts.
   */
  port?: number;

  /**
   * The auto-reconnect interval in milliseconds.
   * If 0 or undefined, auto-reconnect will be disabled.
   */
  reconnectInterval?: number;

  /**
   * The connection-watchdog timeout interval in seconds.
   *
   * The connection-watchdog monitors the socket connection to TWS/IB Gateway for
   * activity and triggers a re-connect if TWS/IB Gateway does not response within
   * the given amount of time.
   * If 0 or undefined, the connection-watchdog will be disabled.
   */
  connectionWatchdogInterval?: number;

  /**
   * Max. number of requests per second, sent to TWS/IB Gateway.
   * Default is 40. IB specifies 50 requests/s as maximum.
   *
   * Note that sending large amount of requests within a small amount of time, significantly increases resource
   * consumption of the TWS/IB Gateway (especially memory consumption). If you experience any lags, hangs or crashes
   * on TWS/IB Gateway while sending request bursts, try to reduce this value.
   */
  maxReqPerSec?: number;

  /**
   * Custom logger implementation.
   *
   * By default [[IBApiNext]] does log to console.
   * If you want to log to a different target (i.e. a file or pipe),
   * set this attribute to your custom [[IBApiNextLogger]] implementation.
   */
  logger?: Logger;
}

/**
 * Next-gen Typescript implementation of the Interactive Brokers TWS (or IB Gateway) API.
 *
 * If you prefer to stay as close as possible to the official TWS API interfaces and functionality,
 * use [[IBApi]].
 *
 * If you prefer to use an API that provides some more convenience functions, such as auto-reconnect
 * or RxJS Observables that stay functional during re-connect, use [[IBApiNext]].
 *
 * [[IBApiNext]] does return RxJS Observables on most of the functions.
 * The first subscriber will send the request to TWS, while the last un-subscriber will cancel it.
 * Any subscriber in between will get a replay of the latest received value(s).
 * This is also the case if you call same function with same arguments multiple times ([[IBApiNext]]
 * will make sure that a similar subscription is not requested multiple times from TWS, but it will
 * become a new observers to the existing subscription).
 * In case of an error, a re-subscribe will send the TWS request again (it is fully compatible to RxJS
 * operators, e.g. retry or retryWhen).
 *
 * Note that connection errors are not reported to the returned Observables as returned by get-functions,
 * but they will simply stop emitting values until TWS connection is re-established.
 * Use [[IBApiNext.connectState]] for observing the connection state.
 */
export class IBApiNext {
  /**
   * Create an [[IBApiNext]] object.
   *
   * @param options Creation options.
   */
  constructor(options?: IBApiNextCreationOptions) {
    this.logger = new IBApiNextLogger(options?.logger ?? new ConsoleLogger());

    // create the IBApiAutoConnection and subscription registry

    this.api = new IBApiAutoConnection(
      options?.reconnectInterval ?? 0,
      (options?.connectionWatchdogInterval ?? 0) * 1000,
      this.logger,
      options
    );
    this.subscriptions = new IBApiNextSubscriptionRegistry(this.api, this);

    // setup error event handler (bound to lifetime of IBApiAutoConnection so we never unregister)

    this.api.on(
      EventName.error,
      (error: Error, code: ErrorCode, reqId: number) => {
        const apiError: IBApiNextError = { error, code, reqId };
        // handle warnings - they are also reported on TWS error callback, but we DO NOT want to emit
        // it as error into the subject (and cancel the subscription).
        if (code >= 2100 && code < 3000) {
          this.logger.warn(
            TWS_LOG_TAG,
            `${error.message} - Code: ${code} - ReqId: ${reqId}`
          );
          return;
        }
        // emit to the subscription subject
        if (reqId !== INVALID_REQ_ID) {
          this.subscriptions.dispatchError(reqId, apiError);
        }
        // emit to global error subject
        this.errorSubject.next(apiError);
      }
    );

    // setup TWS server version event handler  (bound to lifetime of IBApiAutoConnection so we never unregister)

    this.api.on(EventName.server, (version, connectionTime) => {
      this.logger.info(
        TWS_LOG_TAG,
        `Server Version: ${version}. Connection time ${connectionTime}`
      );
    });

    // setup TWS info message event handler  (bound to lifetime of IBApiAutoConnection so we never unregister)

    this.api.on(EventName.info, (message: string) => {
      this.logger.info(TWS_LOG_TAG, message);
    });
  }

  /** The [[IBApiNextLogger]] instance. */
  public readonly logger: IBApiNextLogger;

  /** The [[IBApi]] with auto-reconnect. */
  private readonly api: IBApiAutoConnection;

  /** The subscription registry. */
  private readonly subscriptions: IBApiNextSubscriptionRegistry;

  /**
   * @internal
   * The next unused request id.
   * For internal use only.
   */
  get nextReqId(): number {
    return this._nextReqId++;
  }

  private _nextReqId = 1;

  /**
   * The IBApi error [[Subject]].
   *
   * All errors from [[IBApi]] error events will be sent to this subject.
   */
  public readonly errorSubject = new Subject<IBApiNextError>();

  /** Get the current log level. */
  get logLevel(): LogLevel {
    return this.logger.logLevel;
  }

  /** Set the current log level. */
  set logLevel(level: LogLevel) {
    this.logger.logLevel = level;
    this.api.setServerLogLevel(level);
  }

  /**
   * Get an [[Observable]] to receive errors on IB API.
   *
   * Errors that have a valid request id, will additionally be sent to
   * the observers of the request.
   */
  get error(): Observable<IBApiNextError> {
    return this.errorSubject;
  }

  /**
   * Get an [[Observable]] for observing the connection-state.
   */
  get connectionState(): Observable<ConnectionState> {
    return this.api.connectionState;
  }

  /** Returns true if currently connected, false otherwise. */
  get isConnected(): boolean {
    return this.api.isConnected;
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
  connect(clientId?: number): IBApiNext {
    this.logger.debug(LOG_TAG, `connect(${clientId})`);
    this.api.connect(clientId);
    return this;
  }

  /**
   * Disconnect from the TWS or IB Gateway.
   *
   * Use [[connectionState]] for observing the connection state.
   */
  disconnect(): IBApiNext {
    this.logger.debug(LOG_TAG, "disconnect()");
    this.api.disconnect();
    return this;
  }

  /** currentTime event handler.  */
  private onCurrentTime = (
    subscriptions: Map<number, IBApiNextSubscription<number>>,
    time: number
  ): void => {
    subscriptions.forEach((sub) => {
      sub.next({ all: time });
      sub.complete();
    });
  };

  /**
   * Get TWS's current time.
   */
  getCurrentTime(): Promise<number> {
    return lastValueFrom(
      this.subscriptions
        .register<number>(
          () => {
            this.api.reqCurrentTime();
          },
          undefined,
          [[EventName.currentTime, this.onCurrentTime]],
          "reqCurrentTime" // use same instance id each time, to make sure there is only 1 pending request at time
        )
        .pipe(map((v: { all: number }) => v.all))
    );
  }

  /** managedAccounts event handler.  */
  private onManagedAccts = (
    subscriptions: Map<number, IBApiNextSubscription<string[]>>,
    accountsList: string
  ): void => {
    const accounts = accountsList.split(",");
    subscriptions.forEach((sub) => {
      sub.next({ all: accounts });
      sub.complete();
    });
  };

  /**
   * Get the accounts to which the logged user has access to.
   */
  getManagedAccounts(): Promise<string[]> {
    return lastValueFrom(
      this.subscriptions
        .register<string[]>(
          () => {
            this.api.reqManagedAccts();
          },
          undefined,
          [[EventName.managedAccounts, this.onManagedAccts]],
          "getManagedAccounts" // use same instance id each time, to make sure there is only 1 pending request at time
        )
        .pipe(map((v: { all: string[] }) => v.all))
    );
  }

  /** accountSummary event handler */
  private readonly onAccountSummary = (
    subscriptions: Map<number, IBApiNextSubscription<MutableAccountSummaries>>,
    reqId: number,
    account: string,
    tag: string,
    value: string,
    currency: string
  ): void => {
    // get the subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // update latest value on cache

    const cached = subscription.lastAllValue ?? new MutableAccountSummaries();

    const lastValue = cached
      .getOrAdd(account, () => new MutableAccountSummaryTagValues())
      .getOrAdd(tag, () => new MutableAccountSummaryValues());

    const hasChanged = lastValue.has(currency);

    const updatedValue: AccountSummaryValue = {
      value: value,
      ingressTm: Date.now(),
    };

    lastValue.set(currency, updatedValue);

    // sent change to subscribers

    const accountSummaryUpdate = new MutableAccountSummaries([
      [
        account,
        new MutableAccountSummaryTagValues([
          [tag, new MutableAccountSummaryValues([[currency, updatedValue]])],
        ]),
      ],
    ]);

    if (hasChanged) {
      subscription.next({
        all: cached,
        changed: accountSummaryUpdate,
      });
    } else {
      subscription.next({
        all: cached,
        added: accountSummaryUpdate,
      });
    }
  };

  /**
   * Create subscription to receive the account summaries of all linked accounts as presented in the TWS' Account Summary tab.
   *
   * All account summaries are sent on the first event.
   * Use incrementalUpdates argument to switch between incremental or full update mode.
   * With incremental updates, only changed account summary values will be sent after the initial complete list.
   * Without incremental updates, the complete list of account summaries will be sent again if any value has changed.
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
   */
  getAccountSummary(
    group: string,
    tags: string
  ): Observable<AccountSummariesUpdate> {
    return this.subscriptions.register<MutableAccountSummaries>(
      (reqId) => {
        this.api.reqAccountSummary(reqId, group, tags);
      },
      (reqId) => {
        this.api.cancelAccountSummary(reqId);
      },
      [[EventName.accountSummary, this.onAccountSummary]],
      `${group}:${tags}`
    );
  }

  /** position event handler */
  private readonly onPosition = (
    subscriptions: Map<number, IBApiNextSubscription<MutableAccountPositions>>,
    account: string,
    contract: Contract,
    pos: number,
    avgCost?: number
  ): void => {
    const updatedPosition: Position = { account, contract, pos, avgCost };

    // notify all subscribers

    subscriptions.forEach((subscription) => {
      // update latest value on cache

      let hasAdded = false;
      let hasRemoved = false;

      const cached = subscription.lastAllValue ?? new MutableAccountPositions();
      const accountPositions = cached.getOrAdd(account, () => []);
      const changePositionIndex = accountPositions.findIndex(
        (p) => p.contract.conId == contract.conId
      );

      if (changePositionIndex === -1) {
        // new position - add it
        accountPositions.push(updatedPosition);
        hasAdded = true;
      } else {
        if (!pos) {
          // zero size - remove it
          accountPositions.splice(changePositionIndex);
          hasRemoved = true;
        } else {
          // update
          accountPositions[changePositionIndex] = updatedPosition;
        }
      }

      if (hasAdded) {
        subscription.next({
          all: cached,
          added: new MutableAccountPositions([[account, [updatedPosition]]]),
        });
      } else if (hasRemoved) {
        subscription.next({
          all: cached,
          removed: new MutableAccountPositions([[account, [updatedPosition]]]),
        });
      } else {
        subscription.next({
          all: cached,
          changed: new MutableAccountPositions([[account, [updatedPosition]]]),
        });
      }
    });
  };

  /**
   * Create subscription to receive the positions on all accessible accounts.
   */
  getPositions(): Observable<AccountPositionsUpdate> {
    return this.subscriptions.register<MutableAccountPositions>(
      () => {
        this.api.reqPositions();
      },
      () => {
        this.api.cancelPositions();
      },
      [[EventName.position, this.onPosition]],
      "getPositions"
    );
  }

  /** contractDetails event handler */
  private readonly onContractDetails = (
    subscriptions: Map<number, IBApiNextSubscription<ContractDetails[]>>,
    reqId: number,
    details: ContractDetails
  ) => {
    // get the subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // update latest value on cache

    const cached = subscription.lastAllValue ?? [];
    cached.push(details);

    // sent change to subscribers

    subscription.next({
      all: cached,
      added: [details],
    });
  };

  /** contractDetailsEnd event handler */
  private readonly onContractDetailsEnd = (
    subscriptions: Map<number, IBApiNextSubscription<ContractDetails[]>>,
    reqId: number
  ) => {
    // get the subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // signal completion

    subscription.complete();
  };

  /**
   * Request contract information form TWS.
   * This method will provide all the contracts matching the contract provided.
   *
   * It can also be used to retrieve complete options and futures chains.
   * Though it is now (in API version > 9.72.12) advised to use reqSecDefOptParams for that purpose.
   *
   * This information will be emitted as contractDetails event.
   *
   * @param contract The contract used as sample to query the available contracts.
   */
  getContractDetails(contract: Contract): Observable<ContractDetailsUpdate> {
    return this.subscriptions.register<ContractDetails[]>(
      (reqId) => {
        this.api.reqContractDetails(reqId, contract);
      },
      undefined,
      [
        [EventName.contractDetails, this.onContractDetails],
        [EventName.contractDetailsEnd, this.onContractDetailsEnd],
      ]
    );
  }

  /** pnl event handler. */
  private onPnL = (
    subscriptions: Map<number, IBApiNextSubscription<PnL>>,
    reqId: number,
    dailyPnL: number,
    unrealizedPnL?: number,
    realizedPnL?: number
  ): void => {
    // get subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // sent change to subscribers

    subscription.next({
      all: { dailyPnL, unrealizedPnL, realizedPnL },
    });
  };

  /**
   * Create a subscription to receive real time daily PnL and unrealized PnL updates.
   *
   * @param account Account for which to receive PnL updates.
   * @param modelCode Specify to request PnL updates for a specific model.
   */
  getPnL(account: string, model?: string): Observable<PnL> {
    return this.subscriptions
      .register(
        (reqId) => {
          this.api.reqPnL(reqId, account, model);
        },
        (reqId) => {
          this.api.cancelPnL(reqId);
        },
        [[EventName.pnl, this.onPnL]],
        `${account}:${model}`
      )
      .pipe(map((v: { all: PnL }) => v.all));
  }

  /** pnlSingle event handler. */
  private readonly onPnLSingle = (
    subscriptions: Map<number, IBApiNextSubscription<PnLSingle>>,
    reqId: number,
    pos: number,
    dailyPnL: number,
    unrealizedPnL: number | undefined,
    realizedPnL: number | undefined,
    value: number
  ) => {
    // get subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // sent change to subscribers

    subscription.next({
      all: {
        position: pos,
        dailyPnL: dailyPnL,
        unrealizedPnL: unrealizedPnL,
        realizedPnL: realizedPnL,
        marketValue: value,
      },
    });
  };

  /**
   * Create a subscription to receive real time updates for daily PnL of individual positions.
   *
   * @param account Account in which position exists.
   * @param modelCode Model in which position exists.
   * @param conId Contract ID (conId) of contract to receive daily PnL updates for.
   */
  getPnLSingle(
    account: string,
    modelCode: string,
    conId: number
  ): Observable<PnLSingle> {
    return this.subscriptions
      .register<PnLSingle>(
        (reqId) => {
          this.api.reqPnLSingle(reqId, account, modelCode, conId);
        },
        (reqId) => {
          this.api.cancelPnLSingle(reqId);
        },
        [[EventName.pnlSingle, this.onPnLSingle]],
        `${account}:${modelCode}:${conId}`
      )
      .pipe(map((v: { all: PnLSingle }) => v.all));
  }

  /**
   * Switches data type returned from reqMktData request to "frozen", "delayed" or "delayed-frozen" market data.
   * Requires TWS/IBG v963+.
   *
   * By default only real-time [[MarketDataType.REALTIME]] market data is enabled.
   *
   * The API can receive frozen market data from Trader Workstation.
   * Frozen market data is the last data recorded in our system.
   * During normal trading hours, the API receives real-time market data.
   * Invoking this function with argument [[MarketDataType.FROZEN]] requests a switch to frozen data immediately or after the close.
   * When the market reopens, the market data type will automatically switch back to real time if available.
   *
   * @param type The requested market data type.
   */
  setMarketDataType(type: MarketDataType): void {
    this.api.reqMarketDataType(type);
  }

  /** tickPrice, tickSize and tickGeneric event handler */
  private readonly onTick = (
    subscriptions: Map<number, IBApiNextSubscription<MutableMarketData>>,
    reqId: number,
    tickType: IBApiTickType,
    value?: number
  ): void => {
    // convert -1 on Bid/Ask to undefined

    if (
      value === -1 &&
      (tickType === IBApiTickType.BID ||
        tickType === IBApiTickType.DELAYED_BID ||
        tickType === IBApiTickType.ASK ||
        tickType === IBApiTickType.DELAYED_ASK)
    ) {
      value = undefined;
    }

    // get subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // update latest value on cache

    const cached = subscription.lastAllValue ?? new MutableMarketData();
    const hasChanged = cached.has(tickType);

    const updatedValue: MarketDataTick = {
      value,
      ingressTm: Date.now(),
    };

    cached.set(tickType, updatedValue);

    // deliver to subject

    if (hasChanged) {
      subscription.next({
        all: cached,
        changed: new MutableMarketData([[tickType, updatedValue]]),
      });
    } else {
      subscription.next({
        all: cached,
        added: new MutableMarketData([[tickType, updatedValue]]),
      });
    }
  };

  /** tickOptionComputationHandler event handler */
  private readonly onTickOptionComputation = (
    subscriptions: Map<number, IBApiNextSubscription<MutableMarketData>>,
    reqId: number,
    field: number,
    impliedVolatility: number,
    delta: number,
    optPrice: number,
    pvDividend: number,
    gamma: number,
    vega: number,
    theta: number,
    undPrice: number
  ): void => {
    // get subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // generate [[IBApiNext]] market data ticks

    const now = Date.now();

    const ticks: [IBApiNextTickType, MarketDataTick][] = [
      [
        IBApiNextTickType.OPTION_UNDERLYING,
        { value: undPrice, ingressTm: now },
      ],
      [
        IBApiNextTickType.OPTION_PV_DIVIDEND,
        { value: pvDividend, ingressTm: now },
      ],
    ];

    switch (field) {
      case IBApiTickType.BID_OPTION:
        ticks.push(
          [
            IBApiNextTickType.BID_OPTION_IV,
            { value: impliedVolatility, ingressTm: now },
          ],
          [
            IBApiNextTickType.BID_OPTION_DELTA,
            { value: delta, ingressTm: now },
          ],
          [
            IBApiNextTickType.BID_OPTION_PRICE,
            { value: optPrice, ingressTm: now },
          ],
          [
            IBApiNextTickType.BID_OPTION_GAMMA,
            { value: gamma, ingressTm: now },
          ],
          [IBApiNextTickType.BID_OPTION_VEGA, { value: vega, ingressTm: now }],
          [IBApiNextTickType.BID_OPTION_THETA, { value: theta, ingressTm: now }]
        );
        break;
      case IBApiTickType.DELAYED_BID_OPTION:
        ticks.push(
          [
            IBApiNextTickType.DELAYED_BID_OPTION_IV,
            { value: impliedVolatility, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_BID_OPTION_DELTA,
            { value: delta, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_BID_OPTION_PRICE,
            { value: optPrice, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_BID_OPTION_GAMMA,
            { value: gamma, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_BID_OPTION_VEGA,
            { value: vega, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_BID_OPTION_THETA,
            { value: theta, ingressTm: now },
          ]
        );
        break;
      case IBApiTickType.ASK_OPTION:
        ticks.push(
          [
            IBApiNextTickType.ASK_OPTION_IV,
            { value: impliedVolatility, ingressTm: now },
          ],
          [
            IBApiNextTickType.ASK_OPTION_DELTA,
            { value: delta, ingressTm: now },
          ],
          [
            IBApiNextTickType.ASK_OPTION_PRICE,
            { value: optPrice, ingressTm: now },
          ],
          [
            IBApiNextTickType.ASK_OPTION_GAMMA,
            { value: gamma, ingressTm: now },
          ],
          [IBApiNextTickType.ASK_OPTION_VEGA, { value: vega, ingressTm: now }],
          [IBApiNextTickType.ASK_OPTION_THETA, { value: theta, ingressTm: now }]
        );
        break;
      case IBApiTickType.DELAYED_ASK_OPTION:
        ticks.push(
          [
            IBApiNextTickType.DELAYED_ASK_OPTION_IV,
            { value: impliedVolatility, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_ASK_OPTION_DELTA,
            { value: delta, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_ASK_OPTION_PRICE,
            { value: optPrice, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_ASK_OPTION_GAMMA,
            { value: gamma, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_ASK_OPTION_VEGA,
            { value: vega, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_ASK_OPTION_THETA,
            { value: theta, ingressTm: now },
          ]
        );
        break;
      case IBApiTickType.LAST_OPTION:
        ticks.push(
          [
            IBApiNextTickType.LAST_OPTION_IV,
            { value: impliedVolatility, ingressTm: now },
          ],
          [
            IBApiNextTickType.LAST_OPTION_DELTA,
            { value: delta, ingressTm: now },
          ],
          [
            IBApiNextTickType.LAST_OPTION_PRICE,
            { value: optPrice, ingressTm: now },
          ],
          [
            IBApiNextTickType.LAST_OPTION_GAMMA,
            { value: gamma, ingressTm: now },
          ],
          [IBApiNextTickType.LAST_OPTION_VEGA, { value: vega, ingressTm: now }],
          [
            IBApiNextTickType.LAST_OPTION_THETA,
            { value: theta, ingressTm: now },
          ]
        );
        break;
      case IBApiTickType.DELAYED_LAST_OPTION:
        ticks.push(
          [
            IBApiNextTickType.DELAYED_LAST_OPTION_IV,
            { value: impliedVolatility, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_LAST_OPTION_DELTA,
            { value: delta, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_LAST_OPTION_PRICE,
            { value: optPrice, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_LAST_OPTION_GAMMA,
            { value: gamma, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_LAST_OPTION_VEGA,
            { value: vega, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_LAST_OPTION_THETA,
            { value: theta, ingressTm: now },
          ]
        );
        break;
      case IBApiTickType.MODEL_OPTION:
        ticks.push(
          [
            IBApiNextTickType.MODEL_OPTION_IV,
            { value: impliedVolatility, ingressTm: now },
          ],
          [
            IBApiNextTickType.MODEL_OPTION_DELTA,
            { value: delta, ingressTm: now },
          ],
          [
            IBApiNextTickType.MODEL_OPTION_PRICE,
            { value: optPrice, ingressTm: now },
          ],
          [
            IBApiNextTickType.MODEL_OPTION_GAMMA,
            { value: gamma, ingressTm: now },
          ],
          [
            IBApiNextTickType.MODEL_OPTION_VEGA,
            { value: vega, ingressTm: now },
          ],
          [
            IBApiNextTickType.MODEL_OPTION_THETA,
            { value: theta, ingressTm: now },
          ]
        );
        break;
      case IBApiTickType.DELAYED_MODEL_OPTION:
        ticks.push(
          [
            IBApiNextTickType.DELAYED_MODEL_OPTION_IV,
            { value: impliedVolatility, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_MODEL_OPTION_DELTA,
            { value: delta, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_MODEL_OPTION_PRICE,
            { value: optPrice, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_MODEL_OPTION_GAMMA,
            { value: gamma, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_MODEL_OPTION_VEGA,
            { value: vega, ingressTm: now },
          ],
          [
            IBApiNextTickType.DELAYED_MODEL_OPTION_THETA,
            { value: theta, ingressTm: now },
          ]
        );
        break;
    }

    // update latest value on cache

    const cached = subscription.lastAllValue ?? new MutableMarketData();
    const added = new MutableMarketData();
    const changed = new MutableMarketData();

    ticks.forEach((tick) => {
      if (cached.has(tick[0])) {
        changed.set(tick[0], tick[1]);
      } else {
        added.set(tick[0], tick[1]);
      }
      cached.set(tick[0], tick[1]);
    });

    // deliver to subject

    if (cached.size) {
      subscription.next({
        all: cached,
        added: added.size ? added : undefined,
        changed: changed.size ? changed : undefined,
      });
    }
  };

  /**
   * Create a subscription to receive real time market data.
   * Returns market data for an instrument either in real time or 10-15 minutes delayed (depending on the market data type specified,
   * see [[setMarketDataType]]).
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
   */
  getMarketData(
    contract: Contract,
    genericTickList: string,
    snapshot: boolean,
    regulatorySnapshot: boolean
  ): Observable<MarketDataUpdate> {
    return this.subscriptions.register<MutableMarketData>(
      (reqId) => {
        this.api.reqMktData(
          reqId,
          contract,
          genericTickList,
          snapshot,
          regulatorySnapshot
        );
      },
      (reqId) => {
        // when using snapshot, cancel will cause a "Can't find EId with tickerId" error.
        if (!snapshot && !regulatorySnapshot) {
          this.api.cancelMktData(reqId);
        }
      },
      [
        [EventName.tickPrice, this.onTick],
        [EventName.tickSize, this.onTick],
        [EventName.tickGeneric, this.onTick],
        [EventName.tickOptionComputation, this.onTickOptionComputation],
      ],
      snapshot || regulatorySnapshot
        ? undefined
        : `${JSON.stringify(contract)}:${genericTickList}`
    );
  }

  /** headTimestamp event handler.  */
  private onHeadTimestamp = (
    subscriptions: Map<number, IBApiNextSubscription<string>>,
    reqId: number,
    headTimestamp: string
  ): void => {
    // get subscription
    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // signal timestamp
    subscription.next({ all: headTimestamp });
    subscription.complete();
  };

  /**
   * Get the timestamp of earliest available historical data for a contract and data type.
   *
   * @param reqId An identifier for the request.
   * @param contract [[Contract]] object for which head timestamp is being requested.
   * @param whatToShow Type of data for head timestamp - "BID", "ASK", "TRADES", etc
   * @param useRTH Use regular trading hours only, `true` for yes or `false` for no.
   * @param formatDate Set to 1 to obtain the bars' time as yyyyMMdd HH:mm:ss, set to 2 to obtain it like system time format in seconds.
   */
  getHeadTimestamp(
    contract: Contract,
    whatToShow: string,
    useRTH: boolean,
    formatDate: number
  ): Promise<string> {
    return lastValueFrom(
      this.subscriptions
        .register<string>(
          (reqId) => {
            this.api.reqHeadTimestamp(
              reqId,
              contract,
              whatToShow,
              useRTH,
              formatDate
            );
          },
          (reqId) => {
            this.api.cancelHeadTimestamp(reqId);
          },
          [[EventName.headTimestamp, this.onHeadTimestamp]],
          `${JSON.stringify(contract)}:${whatToShow}:${useRTH}:${formatDate}`
        )
        .pipe(map((v: { all: string }) => v.all))
    );
  }

  /** historicalData event handler */
  private readonly onHistoricalData = (
    subscriptions: Map<number, IBApiNextSubscription<Bar[]>>,
    reqId: number,
    time: string,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number,
    count: number | undefined,
    WAP: number
  ): void => {
    // get subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // append bar or signal completion

    if (time.startsWith("finished")) {
      subscription.complete();
    } else {
      const all = subscription.lastAllValue ?? [];
      const current: Bar = { time };
      if (open !== -1) {
        current.open = open;
      }
      if (high !== -1) {
        current.high = high;
      }
      if (low !== -1) {
        current.low = low;
      }
      if (close !== -1) {
        current.close = close;
      }
      if (volume !== -1) {
        current.volume = volume;
      }
      if (count !== -1) {
        current.count = count;
      }
      if (WAP !== -1) {
        current.WAP = WAP;
      }
      all.push(current);
      subscription.next({
        all,
      });
    }
  };

  /**
   * Get a contracts historical data.
   *
   * When requesting historical data, a finishing time and date is required along with a duration string.
   * For example, having:
   * - endDateTime: 20130701 23:59:59 GMT
   * - durationStr: 3 D
   * will return three days of data counting backwards from July 1st 2013 at 23:59:59 GMT resulting in all the available bars of the last three days
   * until the date and time specified.
   *
   * It is possible to specify a timezone optionally.
   *
   * @see https://interactivebrokers.github.io/tws-api/historical_bars.html for details.
   *
   * @param contract The contract for which we want to retrieve the data.
   * @param endDateTime Request's ending time with format yyyyMMdd HH:mm:ss {TMZ}.
   * @param durationStr The amount of time for which the data needs to be retrieved:
   * - [n] S (seconds)
   * - [n] D (days)
   * - [n] W (weeks)
   * - [n] M (months)
   * - [n] Y (years)
   * @param barSizeSetting the size of the bar:
   * - 1 sec
   * - 5 secs
   * - 15 secs
   * - 30 secs
   * - 1 min
   * - 2 mins
   * - 3 mins
   * - 5 mins
   * - 15 mins
   * - 30 mins
   * - 1 hour
   * - 1 day
   * @param whatToShow the kind of information being retrieved:
   * - TRADES
   * - MIDPOINT
   * - BID
   * - ASK
   * - BID_ASK
   * - HISTORICAL_VOLATILITY
   * - OPTION_IMPLIED_VOLATILITY
   * - FEE_RATE
   * - REBATE_RATE
   * @param useRTH Set to 0 to obtain the data which was also generated outside of the Regular Trading Hours, set to 1 to obtain only the RTH data
   * @param formatDate Set to 1 to obtain the bars' time as yyyyMMdd HH:mm:ss, set to 2 to obtain it like system time format in seconds
   */
  getHistoricalData(
    contract: Contract,
    endDateTime: string | undefined,
    durationStr: string,
    barSizeSetting: BarSizeSetting,
    whatToShow: string,
    useRTH: number,
    formatDate: number
  ): Promise<Bar[]> {
    return lastValueFrom(
      this.subscriptions
        .register<Bar[]>(
          (reqId) => {
            this.api.reqHistoricalData(
              reqId,
              contract,
              endDateTime,
              durationStr,
              barSizeSetting,
              whatToShow,
              useRTH,
              formatDate,
              false
            );
          },
          undefined,
          [[EventName.historicalData, this.onHistoricalData]],
          undefined
        )
        .pipe(map((v: { all: Bar[] }) => v.all))
    );
  }

  /** historicalDataUpdate event handler */
  private readonly onHistoricalDataUpdate = (
    subscriptions: Map<number, IBApiNextSubscription<Bar>>,
    reqId: number,
    time: string,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number,
    count: number,
    WAP: number
  ): void => {
    // get subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // update bar

    const current = subscription.lastAllValue ?? {};
    current.time = time;
    current.open = open !== -1 ? open : undefined;
    current.high = high !== -1 ? high : undefined;
    current.low = low !== -1 ? low : undefined;
    current.close = close !== -1 ? close : undefined;
    current.volume = volume !== -1 ? volume : undefined;
    current.count = count !== -1 ? count : undefined;
    current.WAP = WAP !== -1 ? WAP : undefined;
    subscription.next({
      all: current,
    });
  };

  /**
   * Create a subscription to receive update on the most recent historical data bar of a contract.
   *
   * Use {@link IBApiNext.getHistoricalData} to receive history data and use this function if
   * you want to continue receiving real-time updates on most recent bar.
   *
   * @see https://interactivebrokers.github.io/tws-api/historical_bars.html for details.
   *
   * @param contract The contract for which we want to retrieve the data.
   * @param barSizeSetting the size of the bar:
   * - 1 sec
   * - 5 secs
   * - 15 secs
   * - 30 secs
   * - 1 min
   * - 2 mins
   * - 3 mins
   * - 5 mins
   * - 15 mins
   * - 30 mins
   * - 1 hour
   * - 1 day
   * @param whatToShow the kind of information being retrieved:
   * - TRADES
   * - MIDPOINT
   * - BID
   * - ASK
   * - BID_ASK
   * - HISTORICAL_VOLATILITY
   * - OPTION_IMPLIED_VOLATILITY
   * - FEE_RATE
   * - REBATE_RATE
   * @param formatDate Set to 1 to obtain the bars' time as yyyyMMdd HH:mm:ss, set to 2 to obtain it like system time format in seconds
   */
  getHistoricalDataUpdates(
    contract: Contract,
    barSizeSetting: BarSizeSetting,
    whatToShow: string,
    formatDate: number
  ): Observable<Bar> {
    return this.subscriptions
      .register<Bar>(
        (reqId) => {
          this.api.reqHistoricalData(
            reqId,
            contract,
            "",
            "1 D",
            barSizeSetting,
            whatToShow,
            0,
            formatDate,
            true
          );
        },
        (reqId) => {
          this.api.cancelHistoricalData(reqId);
        },
        [[EventName.historicalDataUpdate, this.onHistoricalDataUpdate]],
        `${JSON.stringify(
          contract
        )}:${barSizeSetting}:${whatToShow}:${formatDate}`
      )
      .pipe(map((v: { all: Bar }) => v.all));
  }

  /** historicalTicks event handler */
  private readonly onHistoricalTicks = (
    subscriptions: Map<number, IBApiNextSubscription<HistoricalTick[]>>,
    reqId: number,
    ticks: HistoricalTick[],
    done: boolean
  ): void => {
    // get subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // append tick

    let allTicks = subscription.lastAllValue;
    allTicks = allTicks ? allTicks.concat(ticks) : ticks;

    subscription.next({
      all: allTicks,
    });

    if (done) {
      subscription.complete();
    }
  };

  /**
   * Create a subscription to receive historical mid prices from Time&Sales data of an instrument.
   * The next callback will be invoked each time a new tick is received from TWS.
   * The complete callback will be invoked when all required ticks have been
   * received.
   *
   * @param contract [[Contract]] object that is subject of query
   * @param startDateTime "20170701 12:01:00". Uses TWS timezone specified at login.
   * @param endDateTime "20170701 13:01:00". In TWS timezone. Exactly one of start time and end time has to be defined.
   * @param numberOfTicks Number of distinct data points. Max currently 1000 per request.
   * @param useRTH Data from regular trading hours (1), or all available hours (0)
   */
  getHistoricalTicksMid(
    contract: Contract,
    startDateTime: string,
    endDateTime: string,
    numberOfTicks: number,
    useRTH: number
  ): Observable<HistoricalTick[]> {
    return this.subscriptions
      .register<HistoricalTick[]>(
        (reqId) => {
          this.api.reqHistoricalTicks(
            reqId,
            contract,
            startDateTime,
            endDateTime,
            numberOfTicks,
            "MIDPOINT",
            useRTH,
            false
          );
        },
        undefined,
        [[EventName.historicalTicks, this.onHistoricalTicks]],
        undefined
      )
      .pipe(map((v: { all: HistoricalTick[] }) => v.all));
  }

  /** historicalTicksBidAsk event handler */
  private readonly onHistoricalTicksBidAsk = (
    subscriptions: Map<number, IBApiNextSubscription<HistoricalTickBidAsk[]>>,
    reqId: number,
    ticks: HistoricalTickBidAsk[],
    done: boolean
  ): void => {
    // get subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // append tick

    let allTicks = subscription.lastAllValue;
    allTicks = allTicks ? allTicks.concat(ticks) : ticks;

    subscription.next({
      all: allTicks,
    });

    if (done) {
      subscription.complete();
    }
  };

  /**
   * Create a subscription to receive historical bid and ask prices from Time&Sales data of an instrument.
   * The next callback will be invoked each time a new tick is received from TWS.
   * The complete callback will be invoked when all required ticks have been
   * received.
   *
   * @param contract [[Contract]] object that is subject of query
   * @param startDateTime "20170701 12:01:00". Uses TWS timezone specified at login.
   * @param endDateTime "20170701 13:01:00". In TWS timezone. Exactly one of start time and end time has to be defined.
   * @param numberOfTicks Number of distinct data points. Max currently 1000 per request.
   * @param useRTH Data from regular trading hours (1), or all available hours (0)
   * @param ignoreSize A filter only used when the source price is Bid_Ask
   */
  getHistoricalTicksBidAsk(
    contract: Contract,
    startDateTime: string,
    endDateTime: string,
    numberOfTicks: number,
    useRTH: number,
    ignoreSize: boolean
  ): Observable<HistoricalTickBidAsk[]> {
    return this.subscriptions
      .register<HistoricalTickBidAsk[]>(
        (reqId) => {
          this.api.reqHistoricalTicks(
            reqId,
            contract,
            startDateTime,
            endDateTime,
            numberOfTicks,
            "BID_ASK",
            useRTH,
            ignoreSize
          );
        },
        undefined,
        [[EventName.historicalTicksBidAsk, this.onHistoricalTicksBidAsk]],
        undefined
      )
      .pipe(map((v: { all: HistoricalTickBidAsk[] }) => v.all));
  }

  /** historicalTicksLast event handler */
  private readonly onHistoricalTicksLast = (
    subscriptions: Map<number, IBApiNextSubscription<HistoricalTickLast[]>>,
    reqId: number,
    ticks: HistoricalTickLast[],
    done: boolean
  ): void => {
    // get subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // append tick

    let allTicks = subscription.lastAllValue;
    allTicks = allTicks ? allTicks.concat(ticks) : ticks;

    subscription.next({
      all: allTicks,
    });

    if (done) {
      subscription.complete();
    }
  };

  /**
   * Create a subscription to receive historical last trade prices from Time&Sales data of an instrument.
   * The next callback will be invoked each time a new tick is received from TWS.
   * The complete callback will be invoked when all required ticks have been
   * received.
   *
   * @param contract [[Contract]] object that is subject of query
   * @param startDateTime "20170701 12:01:00". Uses TWS timezone specified at login.
   * @param endDateTime "20170701 13:01:00". In TWS timezone. Exactly one of start time and end time has to be defined.
   * @param numberOfTicks Number of distinct data points. Max 1000 per request.
   * @param useRTH Data from regular trading hours (1), or all available hours (0)
   */
  getHistoricalTicksLast(
    contract: Contract,
    startDateTime: string,
    endDateTime: string,
    numberOfTicks: number,
    useRTH: number
  ): Observable<HistoricalTickLast[]> {
    return this.subscriptions
      .register<HistoricalTickLast[]>(
        (reqId) => {
          this.api.reqHistoricalTicks(
            reqId,
            contract,
            startDateTime,
            endDateTime,
            numberOfTicks,
            "TRADES",
            useRTH,
            false
          );
        },
        undefined,
        [[EventName.historicalTicksLast, this.onHistoricalTicksLast]],
        undefined
      )
      .pipe(map((v: { all: HistoricalTickLast[] }) => v.all));
  }

  /** mktDepthExchanges event handler */
  private readonly onMktDepthExchanges = (
    subscriptions: Map<
      number,
      IBApiNextSubscription<DepthMktDataDescription[]>
    >,
    depthMktDataDescriptions: DepthMktDataDescription[]
  ): void => {
    subscriptions.forEach((sub) => {
      sub.next({
        all: depthMktDataDescriptions,
      });
      sub.complete();
    });
  };

  /**
   * Get venues for which market data is returned on getMarketDepthL2 (those with market makers).
   */
  getMarketDepthExchanges(): Promise<DepthMktDataDescription[]> {
    return lastValueFrom(
      this.subscriptions
        .register<DepthMktDataDescription[]>(
          () => {
            this.api.reqMktDepthExchanges();
          },
          undefined,
          [[EventName.mktDepthExchanges, this.onMktDepthExchanges]],
          "reqMktDepthExchanges" // use same instance id each time, to make sure there is only 1 pending request at time
        )
        .pipe(map((v: { all: DepthMktDataDescription[] }) => v.all))
    );
  }

  /** histogramData event handler */
  private readonly onHistogramData = (
    subscriptions: Map<number, IBApiNextSubscription<HistogramEntry[]>>,
    reqId: number,
    data: HistogramEntry[]
  ): void => {
    // get the subscription
    const sub = subscriptions.get(reqId);
    if (!sub) {
      return;
    }

    // deliver data
    sub.next({ all: data });
    sub.complete();
  };

  /**
   * Get data histogram of specified contract.
   *
   * @param contract [[Contract]] object for which histogram is being requested
   * @param useRTH Use regular trading hours only, `true` for yes or `false` for no.
   * @param duration Period duration of which data is being requested
   * @param durationUnit Duration unit of which data is being requested
   */
  getHistogramData(
    contract: Contract,
    useRTH: boolean,
    duration: number,
    durationUnit: DurationUnit
  ): Promise<HistogramEntry[]> {
    return lastValueFrom(
      this.subscriptions
        .register<HistogramEntry[]>(
          (reqId) => {
            this.api.reqHistogramData(
              reqId,
              contract,
              useRTH,
              duration,
              durationUnit
            );
          },
          (reqId) => {
            this.api.cancelHistogramData(reqId);
          },
          [[EventName.histogramData, this.onHistogramData]],
          `${JSON.stringify(contract)}:${useRTH}:${duration}:${durationUnit}`
        )
        .pipe(map((v: { all: HistogramEntry[] }) => v.all))
    );
  }

  /**
   * Feeds in currently open orders.
   *
   * @param listener
   * orderId: The order's unique id.
   *
   * contract: The order's [[Contract]]
   *
   * order: The currently active [[Order]]
   *
   * orderState: The order's [[OrderState]]
   *
   * @see [[placeOrder]], [[reqAllOpenOrders]], [[reqAutoOpenOrders]]
   */
  private readonly onOpenOrder = (
    subscriptions: Map<number, IBApiNextSubscription<OpenOrder[]>>,
    orderId: number,
    contract: Contract,
    order: Order,
    orderState: OrderState
  ): void => {
    subscriptions.forEach((sub) => {
      const allOrders = sub.lastAllValue ?? [];
      allOrders.push({ orderId, contract, order, orderState });
      sub.next({
        all: allOrders,
      });
    });
  };

  /**
   *  Ends the subscrition once all openOrders are recieved
   *  @param subscriptions
   */
  private readonly onOpenOrderEnd = (
    subscriptions: Map<number, IBApiNextSubscription<OpenOrder[]>>
  ): void => {
    subscriptions.forEach((sub) => {
      sub.complete();
    });
  };

  /**
   * Response to API bind order control message.
   *
   * @param orderId: permId
   * @param apiClientId: API client id.
   * @param apiOrderId: API order id.
   *
   * @see [[reqOpenOrders]]
   */
  private readonly onOrderBound = (
    // TODO finish implementation
    subscription: Map<number, IBApiNextSubscription<OpenOrder[]>>,
    orderId: number,
    apiClientId: number,
    apiOrderId: number
  ): void => {
    // not sure what it's used for
  };

  /**
   * Requests all current open orders in associated accounts at the current moment.
   */
  getAllOpenOrders(): Promise<OpenOrder[]> {
    return lastValueFrom(
      this.subscriptions
        .register<OpenOrder[]>(
          () => {
            this.api.reqAllOpenOrders();
          },
          undefined,
          [
            [EventName.openOrder, this.onOpenOrder],
            [EventName.orderStatus, this.onOrderBound],
            [EventName.openOrderEnd, this.onOpenOrderEnd],
          ]
        )
        .pipe(map((v: { all: OpenOrder[] }) => v.all))
    );
  }
}
