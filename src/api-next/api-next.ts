import { lastValueFrom, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import {
  Bar,
  BarSizeSetting,
  CommissionReport,
  Contract,
  ContractDescription,
  ContractDetails,
  DepthMktDataDescription,
  DurationUnit,
  ErrorCode,
  EventName,
  Execution,
  ExecutionDetail,
  ExecutionFilter,
  HistogramEntry,
  HistoricalTick,
  HistoricalTickBidAsk,
  HistoricalTickLast,
  OpenOrder,
  Order,
  OrderBook,
  OrderBookRow,
  OrderBookUpdate,
  OrderCancel,
  OrderState,
  PriceIncrement,
  ScannerSubscription,
  SecType,
  TagValue,
  TickByTickDataType,
  WhatToShow,
} from "../";
import LogLevel from "../api/data/enum/log-level";
import { TickAttribLast } from "../api/historical/historicalTickLast";
import { TickByTickAllLast } from "../api/market/tickByTickAllLast";
import OrderStatus from "../api/order/enum/order-status";
import { isNonFatalError } from "../common/errorCode";
import {
  MutableAccountSummaries,
  MutableAccountSummaryTagValues,
  MutableAccountSummaryValues,
} from "../core/api-next/api/account/mutable-account-summary";
import { MutableMarketData } from "../core/api-next/api/market/mutable-market-data";
import { MutableAccountPositions } from "../core/api-next/api/position/mutable-account-positions-update";
import { IBApiAutoConnection } from "../core/api-next/auto-connection";
import { ConsoleLogger } from "../core/api-next/console-logger";
import { IBApiNextItemListUpdate } from "../core/api-next/item-list-update";
import { IBApiNextLogger } from "../core/api-next/logger";
import { IBApiNextSubscription } from "../core/api-next/subscription";
import { IBApiNextSubscriptionRegistry } from "../core/api-next/subscription-registry";
import {
  AccountPositionsUpdate,
  AccountSummariesUpdate,
  AccountSummaryValue,
  AccountUpdate,
  AccountUpdatesUpdate,
  ConnectionState,
  IBApiNextError,
  IBApiNextTickType,
  IBApiTickType,
  MarketDataTick,
  MarketDataType,
  MarketDataUpdate,
  OpenOrdersUpdate,
  OrderBookRowPosition,
  PnL,
  PnLSingle,
  Position,
  SecurityDefinitionOptionParameterType,
} from "./";
import { Logger } from "./common/logger";
import {
  MarketScannerItem,
  MarketScannerItemRank,
  MarketScannerRows,
  MarketScannerUpdate,
} from "./market-scanner/market-scanner";

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

function filterMap(
  map: Map<number, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  pred: (k: number, v: any) => boolean, // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  const result = new Map();
  for (const [k, v] of map) {
    if (pred(k, v)) {
      result.set(k, v);
    }
  }
  return result;
}

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
      options,
    );
    this.subscriptions = new IBApiNextSubscriptionRegistry(this.api, this);

    // setup error event handler (bound to lifetime of IBApiAutoConnection so we never unregister)

    this.api.on(
      EventName.error,
      (
        error: Error,
        code: ErrorCode,
        reqId: number,
        advancedOrderReject?: unknown,
      ) => {
        const apiError = new IBApiNextError(
          error,
          code,
          reqId,
          advancedOrderReject,
        );
        // emit to the subscription subject
        if (reqId !== ErrorCode.NO_VALID_ID && !isNonFatalError(code, error)) {
          this.subscriptions.dispatchError(apiError);
        }
        // emit to global error subject
        this.errorSubject.next(apiError);
      },
    );

    // setup TWS server version event handler  (bound to lifetime of IBApiAutoConnection so we never unregister)

    this.api.on(EventName.server, (version, connectionTime) => {
      this.logger.info(
        TWS_LOG_TAG,
        `Server Version: ${version}. Connection time ${connectionTime}`,
      );
    });

    // setup TWS info message event handler  (bound to lifetime of IBApiAutoConnection so we never unregister)
    this.api.on(EventName.info, (message: string, code: number) => {
      if (
        code === ErrorCode.FAIL_CONNECTION_LOST_BETWEEN_SERVER_AND_TWS ||
        code === ErrorCode.FAIL_CONNECTION_LOST_BETWEEN_TWS_AND_SERVER
      ) {
        this.api.onDisconnected();
      }
      this.logger.info(TWS_LOG_TAG, `${message} - Code: ${code}`);
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
  private readonly onCurrentTime = (
    subscriptions: Map<number, IBApiNextSubscription<number>>,
    time: number,
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
          "getCurrentTime", // Use the same instance ID each time to ensure there is only one pending request at a time.
        )
        .pipe(map((v: { all: number }) => v.all)),
      {
        defaultValue: 0,
      },
    );
  }

  /** managedAccounts event handler.  */
  private onManagedAccts = (
    subscriptions: Map<number, IBApiNextSubscription<string[]>>,
    accountsList: string,
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
          "getManagedAccounts", // Use the same instance ID each time to ensure there is only one pending request at a time.
        )
        .pipe(map((v: { all: string[] }) => v.all)),
      {
        defaultValue: [],
      },
    );
  }

  /** accountSummary event handler */
  private readonly onAccountSummary = (
    subscriptions: Map<number, IBApiNextSubscription<MutableAccountSummaries>>,
    reqId: number,
    account: string,
    tag: string,
    value: string,
    currency: string,
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

    if (!subscription.endEventReceived) {
      subscription.lastAllValue = cached;
    } else if (hasChanged) {
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

  /** accountSummaryEnd event handler */
  private readonly onAccountSummaryEnd = (
    subscriptions: Map<number, IBApiNextSubscription<MutableAccountSummaries>>,
    reqId: number,
  ): void => {
    // get the subscription
    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // get latest value on cache
    const cached = subscription.lastAllValue ?? new MutableAccountSummaries();

    // sent data to subscribers
    subscription.endEventReceived = true;
    subscription.next({ all: cached });
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
   * - PreviousDayEquityWithLoanValue — Marginable Equity with Loan value as of 16:00 ET the previous day
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
    tags: string,
  ): Observable<AccountSummariesUpdate> {
    return this.subscriptions.register<MutableAccountSummaries>(
      (reqId) => {
        this.api.reqAccountSummary(reqId, group, tags);
      },
      (reqId) => {
        this.api.cancelAccountSummary(reqId);
      },
      [
        [EventName.accountSummary, this.onAccountSummary],
        [EventName.accountSummaryEnd, this.onAccountSummaryEnd],
      ],
      `getAccountSummary+${group}:${tags}`, // Use the same instance ID each time to ensure there is only one pending request at a time.
    );
  }

  /**
   * Response to API updateAccountValue control message.
   *
   * @param subscriptions listeners
   * @param account The IBKR account Id.
   * @param tag the tag of the value.
   * @param value numetical value associated to the tag.
   * @param currency the currency of the value.
   *
   * @see [[reqAccountUpdates]]
   *
   * @todo Filter subscriptions notifications in callbacks using instanceId to finish this implementation
   */
  private readonly onUpdateAccountValue = (
    subscriptions: Map<number, IBApiNextSubscription<AccountUpdate>>,
    tag: string,
    value: string,
    currency: string,
    account: string,
  ): void => {
    filterMap(
      subscriptions,
      (_k: number, v: IBApiNextSubscription<PriceIncrement[]>) =>
        v.instanceId === "getAccountUpdates" ||
        v.instanceId === `getAccountUpdates+${account}`,
    ).forEach((subscription) => {
      // update latest value on cache
      const all: AccountUpdate = subscription.lastAllValue ?? {};
      const cached = all?.value ?? new MutableAccountSummaries();

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
      all.value = cached;
      if (hasChanged) {
        subscription.next({
          all: all,
          changed: { value: accountSummaryUpdate },
        });
      } else {
        subscription.next({
          all: all,
          changed: { value: accountSummaryUpdate },
        });
      }
    });
  };

  /**
   * Response to API updatePortfolio control message.
   *
   * @param subscriptions listeners
   * @param contract The position's [[Contract]]
   * @param pos The number of units held.
   * @param marketPrice the market price of the contract.
   * @param marketValue the market value of the position.
   * @param avgCost The average cost of the position.
   * @param unrealizedPNL The unrealized PNL of the position.
   * @param realizedPNL The realized PNL of the position.
   * @param account The IBKR account Id.
   *
   * @see [[reqAccountUpdates]]
   *
   * @todo Filter subscriptions notifications in callbacks using instanceId to finish this implementation
   */
  private readonly onUpdatePortfolio = (
    subscriptions: Map<number, IBApiNextSubscription<AccountUpdate>>,
    contract: Contract,
    pos: number,
    marketPrice: number,
    marketValue: number,
    avgCost: number,
    unrealizedPNL: number,
    realizedPNL: number,
    account: string,
  ): void => {
    const updatedPosition: Position = {
      account,
      contract,
      pos,
      avgCost,
      marketPrice,
      marketValue,
      unrealizedPNL,
      realizedPNL,
    };
    // notify all subscribers
    filterMap(
      subscriptions,
      (_k: number, v: IBApiNextSubscription<PriceIncrement[]>) =>
        v.instanceId === "getAccountUpdates" ||
        v.instanceId === `getAccountUpdates+${account}`,
    ).forEach((subscription) => {
      // update latest value on cache

      let hasAdded = false;
      let hasRemoved = false;
      const all: AccountUpdate = subscription.lastAllValue ?? {};
      const cached = all?.portfolio ?? new MutableAccountPositions();
      const accountPositions = cached.getOrAdd(account, () => []);
      const changePositionIndex = accountPositions.findIndex(
        (p) => p.contract.conId == contract.conId,
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
      all.portfolio = cached;
      if (hasAdded) {
        subscription.next({
          all: all,
          added: {
            portfolio: new MutableAccountPositions([
              [account, [updatedPosition]],
            ]),
          },
        });
      } else if (hasRemoved) {
        subscription.next({
          all: all,
          removed: {
            portfolio: new MutableAccountPositions([
              [account, [updatedPosition]],
            ]),
          },
        });
      } else {
        subscription.next({
          all: all,
          changed: {
            portfolio: new MutableAccountPositions([
              [account, [updatedPosition]],
            ]),
          },
        });
      }
    });
  };

  /**
   * Response to API updateAccountTime control message.
   *
   * @param subscriptions listeners
   * @param timeStamp the current timestamp
   *
   * @see [[reqAccountUpdates]]
   */
  private readonly onUpdateAccountTime = (
    subscriptions: Map<number, IBApiNextSubscription<AccountUpdate>>,
    timeStamp: string,
  ): void => {
    subscriptions.forEach((sub) => {
      const changed: AccountUpdate = { timestamp: timeStamp };
      const all: AccountUpdate = sub.lastAllValue ?? {};
      all.timestamp = changed.timestamp;
      sub.next({
        all: all,
        changed: changed,
      });
    });
  };

  /**
   * Response to API accountDownloadEnd control message.
   *
   * @param subscriptions listeners
   * @param accountName the account name
   *
   * @see [[reqAccountUpdates]]
   *
   * @todo Filter subscriptions notifications in callbacks using instanceId to finish this implementation
   */
  private readonly onAccountDownloadEnd = (
    subscriptions: Map<number, IBApiNextSubscription<AccountUpdate>>,
    accountName: string,
  ): void => {
    // notify all subscribers
    filterMap(
      subscriptions,
      (_k: number, v: IBApiNextSubscription<PriceIncrement[]>) =>
        v.instanceId === "getAccountUpdates" ||
        v.instanceId === `getAccountUpdates+${accountName}`,
    ).forEach((subscription) => {
      const all: AccountUpdate = subscription.lastAllValue ?? {};
      subscription.endEventReceived = true;
      subscription.next({ all });
    });
  };

  /**
   * The getAccountUpdates function creates a subscription to the TWS through which account and portfolio information is delivered.
   * This information is the exact same as the one displayed within the TWS' Account Window.
   * In a single account structure, the account number is not necessary.
   * Just as with the TWS' Account Window, unless there is a position change this information is updated at a fixed interval of three minutes.
   *
   * @param acctCode the specific account to retrieve.
   *
   * @see [[reqAccountUpdates]], [[reqGlobalCancel]]
   *
   * @todo Filter subscriptions notifications in callbacks using instanceId to finish this implementation
   */
  getAccountUpdates(acctCode?: string): Observable<AccountUpdatesUpdate> {
    return this.subscriptions.register<AccountUpdate>(
      () => {
        this.api.reqAccountUpdates(true, acctCode);
      },
      () => {
        this.api.reqAccountUpdates(false, acctCode);
      },
      [
        [EventName.updateAccountValue, this.onUpdateAccountValue],
        [EventName.updatePortfolio, this.onUpdatePortfolio],
        [EventName.accountDownloadEnd, this.onAccountDownloadEnd],
        [EventName.updateAccountTime, this.onUpdateAccountTime],
      ],
      acctCode ? `getAccountUpdates+${acctCode}` : "getAccountUpdates", // Use the same instance ID each time to ensure there is only one pending request at a time.
    );
  }

  /** position event handler */
  private readonly onPosition = (
    subscriptions: Map<number, IBApiNextSubscription<MutableAccountPositions>>,
    account: string,
    contract: Contract,
    pos: number,
    avgCost?: number,
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
        (p) => p.contract.conId == contract.conId,
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

      if (!subscription.endEventReceived) {
        subscription.lastAllValue = cached;
      } else if (hasAdded) {
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

  /** position end enumeration event handler */
  private readonly onPositionEnd = (
    subscriptions: Map<number, IBApiNextSubscription<MutableAccountPositions>>,
  ): void => {
    // notify all subscribers
    subscriptions.forEach((subscription) => {
      const lastAllValue =
        subscription.lastAllValue ?? new MutableAccountPositions();
      subscription.endEventReceived = true;
      subscription.next({ all: lastAllValue });
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
      [
        [EventName.position, this.onPosition],
        [EventName.positionEnd, this.onPositionEnd],
      ],
      "getPositions", // Use the same instance ID each time to ensure there is only one pending request at a time.
    );
  }

  /** contractDetails event handler */
  private readonly onContractDetails = (
    subscriptions: Map<number, IBApiNextSubscription<ContractDetails[]>>,
    reqId: number,
    details: ContractDetails,
  ) => {
    // get the subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // append to list

    const cached = subscription.lastAllValue ?? [];
    cached.push(details);

    // sent change to subscribers

    subscription.next({
      all: cached,
    });
  };

  /** contractDetailsEnd event handler */
  private readonly onContractDetailsEnd = (
    subscriptions: Map<number, IBApiNextSubscription<ContractDetails[]>>,
    reqId: number,
  ) => {
    subscriptions.get(reqId)?.complete();
  };

  /**
   * Request contract information from TWS.
   * This method will provide all the contracts matching the contract provided.
   *
   * It can also be used to retrieve complete options and futures chains.
   * Though it is now (in API version > 9.72.12) advised to use reqSecDefOptParams for that purpose.
   *
   * This information will be emitted as contractDetails event.
   *
   * @param contract The contract used as sample to query the available contracts.
   */
  getContractDetails(contract: Contract): Promise<ContractDetails[]> {
    return lastValueFrom(
      this.subscriptions
        .register<ContractDetails[]>(
          (reqId) => {
            this.api.reqContractDetails(reqId, contract);
          },
          undefined,
          [
            [EventName.contractDetails, this.onContractDetails],
            [EventName.bondContractDetails, this.onContractDetails],
            [EventName.contractDetailsEnd, this.onContractDetailsEnd],
          ],
        )
        .pipe(map((v: { all: ContractDetails[] }) => v.all)),
      {
        defaultValue: [],
      },
    );
  }

  /** securityDefinitionOptionParameter event handler */
  private readonly onSecurityDefinitionOptionParameter = (
    subscriptions: Map<
      number,
      IBApiNextSubscription<SecurityDefinitionOptionParameterType[]>
    >,
    reqId: number,
    exchange: string,
    underlyingConId: number,
    tradingClass: string,
    multiplier: string,
    expirations: string[],
    strikes: number[],
  ) => {
    // get the subscription

    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // append to list

    const cached = subscription.lastAllValue ?? [];
    cached.push({
      exchange: exchange as string,
      underlyingConId: underlyingConId as number,
      tradingClass: tradingClass as string,
      multiplier: parseInt(multiplier) as number,
      expirations: expirations as string[],
      strikes: strikes as number[],
    });

    // sent change to subscribers

    subscription.next({
      all: cached,
    });
  };

  /** securityDefinitionOptionParameterEnd event handler */
  private readonly onSecurityDefinitionOptionParameterEnd = (
    subscriptions: Map<
      number,
      IBApiNextSubscription<SecurityDefinitionOptionParameterType[]>
    >,
    reqId: number,
  ) => {
    subscriptions.get(reqId)?.complete();
  };

  /**
   * Requests security definition option parameters for viewing a contract's option chain.
   *
   * This information will be emitted as securityDefinitionOptionParameter event.
   *
   * @param underlyingSymbol The underlying symbol to query the available contracts.
   * @param futFopExchange The exchange on which the returned options are trading. Can be set to the empty string "" for all exchanges.
   * @param underlyingSecType The type of the underlying security, i.e. STK.
   * @param underlyingConId the contract ID of the underlying security.
   */
  getSecDefOptParams(
    underlyingSymbol: string,
    futFopExchange: string,
    underlyingSecType: SecType,
    underlyingConId: number,
  ): Promise<SecurityDefinitionOptionParameterType[]> {
    return lastValueFrom(
      this.subscriptions
        .register<SecurityDefinitionOptionParameterType[]>(
          (reqId) => {
            this.api.reqSecDefOptParams(
              reqId,
              underlyingSymbol,
              futFopExchange,
              underlyingSecType,
              underlyingConId,
            );
          },
          undefined,
          [
            [
              EventName.securityDefinitionOptionParameter,
              this.onSecurityDefinitionOptionParameter,
            ],
            [
              EventName.securityDefinitionOptionParameterEnd,
              this.onSecurityDefinitionOptionParameterEnd,
            ],
          ],
        )
        .pipe(
          map((v: { all: SecurityDefinitionOptionParameterType[] }) => v.all),
        ),
      {
        defaultValue: [],
      },
    );
  }

  /** pnl event handler. */
  private onPnL = (
    subscriptions: Map<number, IBApiNextSubscription<PnL>>,
    reqId: number,
    dailyPnL: number,
    unrealizedPnL?: number,
    realizedPnL?: number,
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
  getPnL(account: string, modelCode?: string): Observable<PnL> {
    return this.subscriptions
      .register(
        (reqId) => {
          this.api.reqPnL(reqId, account, modelCode);
        },
        (reqId) => {
          this.api.cancelPnL(reqId);
        },
        [[EventName.pnl, this.onPnL]],
        `getPnl+${account}:${modelCode}`, // Use the same instance ID each time to ensure there is only one pending request at a time.
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
    value: number,
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
    conId: number,
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
        `getPnLSingle+${account}:${modelCode}:${conId}`, // Use the same instance ID each time to ensure there is only one pending request at a time.
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
    value?: number,
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
    undPrice: number,
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
          [
            IBApiNextTickType.BID_OPTION_THETA,
            { value: theta, ingressTm: now },
          ],
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
          ],
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
          [
            IBApiNextTickType.ASK_OPTION_THETA,
            { value: theta, ingressTm: now },
          ],
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
          ],
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
          ],
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
          ],
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
          ],
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
          ],
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

  /** tickSnapshotEnd event handler */
  private readonly onTickSnapshotEnd = (
    subscriptions: Map<number, IBApiNextSubscription<MutableMarketData>>,
    reqId: number,
  ) => {
    subscriptions.get(reqId)?.complete();
  };

  /**
   * Create a subscription to receive real time market data.
   * Returns market data for an instrument either in real time or 10-15 minutes delayed (depending on the market data type specified,
   * see [[setMarketDataType]]).
   * If you plan to use `getMarketData` with either `snapshot` or `regulatorySnapshot`set to `true`
   * then you should consider using `getMarketDataSingle` instead.
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
   * A `true` value will return a one-time snapshot, completing the Observable when finished, after 11s latest.
   * A `false` value will provide endless streaming data, never completing the Observable.
   * @param regulatorySnapshot Snapshot for US stocks requests NBBO snapshots for users which have "US Securities Snapshot Bundle" subscription
   * but not corresponding Network A, B, or C subscription necessary for streaming * market data.
   * One-time snapshot of current market price that will incur a fee of 1 cent to the account per snapshot.
   */
  getMarketData(
    contract: Contract,
    genericTickList: string,
    snapshot: boolean,
    regulatorySnapshot: boolean,
  ): Observable<MarketDataUpdate> {
    return this.subscriptions.register<MutableMarketData>(
      (reqId) => {
        this.api.reqMktData(
          reqId,
          contract,
          genericTickList,
          snapshot,
          regulatorySnapshot,
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
        [EventName.tickSnapshotEnd, this.onTickSnapshotEnd],
      ],
      `getMarketData+${JSON.stringify(
        contract,
      )}:${genericTickList}:${snapshot}:${regulatorySnapshot}`, // Use the same instance ID each time to ensure there is only one pending request at a time.
    );
  }

  /**
   * Fetch a snapshot of real time market data.
   * Returns market data for an instrument either in real time or 10-15 minutes delayed (depending on the market data type specified,
   * see [[setMarketDataType]]).
   * getMarketDataSingle will collect market data for a maximum of 11 seconds and then return the result.
   *
   * @param contract The [[Contract]] for which the data is being requested
   * @param genericTickList comma  separated ids of the generic ticks
   * Look at getMarketData documentation for a list of available generic ticks.
   * @param regulatorySnapshot Snapshot for US stocks requests NBBO snapshots for users which have "US Securities Snapshot Bundle" subscription
   * but not corresponding Network A, B, or C subscription necessary for streaming * market data.
   * One-time snapshot of current market price that will incur a fee of 1 cent to the account per snapshot.
   */
  getMarketDataSnapshot(
    contract: Contract,
    genericTickList: string,
    regulatorySnapshot: boolean,
  ): Promise<MutableMarketData> {
    return lastValueFrom(
      this.getMarketData(
        contract,
        genericTickList,
        true,
        regulatorySnapshot,
      ).pipe(map((v: { all: MutableMarketData }) => v.all)),
      {
        defaultValue: new MutableMarketData(),
      },
    );
  }

  /**
   * @deprecated please use getMarketDataSnapshot instead of getMarketDataSingle.
   */
  getMarketDataSingle = this.getMarketDataSnapshot;

  /** headTimestamp event handler.  */
  private onHeadTimestamp = (
    subscriptions: Map<number, IBApiNextSubscription<string>>,
    reqId: number,
    headTimestamp: string,
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
   * @param contract [[Contract]] object for which head timestamp is being requested.
   * @param whatToShow Type of data for head timestamp - "BID", "ASK", "TRADES", etc
   * @param useRTH Use regular trading hours only, `true` for yes or `false` for no.
   * @param formatDate Set to 1 to obtain the bars' time as yyyyMMdd HH:mm:ss, set to 2 to obtain it like system time format in seconds.
   */
  getHeadTimestamp(
    contract: Contract,
    whatToShow: WhatToShow,
    useRTH: boolean,
    formatDate: number,
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
              formatDate,
            );
          },
          (reqId) => {
            this.api.cancelHeadTimestamp(reqId);
          },
          [[EventName.headTimestamp, this.onHeadTimestamp]],
          `getHeadTimestamp+${JSON.stringify(
            contract,
          )}:${whatToShow}:${useRTH}:${formatDate}`, // Use the same instance ID each time to ensure there is only one pending request at a time.
        )
        .pipe(map((v: { all: string }) => v.all)),
      {
        defaultValue: "",
      },
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
    WAP: number,
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
   * - 1 secs
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
   * @param useRTH Set to false to obtain the data which was also generated outside of the Regular Trading Hours, set to true to obtain only the RTH data
   * @param formatDate Set to 1 to obtain the bars' time as yyyyMMdd HH:mm:ss, set to 2 to obtain it like system time format in seconds
   */
  getHistoricalData(
    contract: Contract,
    endDateTime: string | undefined,
    durationStr: string,
    barSizeSetting: BarSizeSetting,
    whatToShow: WhatToShow,
    useRTH: number | boolean,
    formatDate: number,
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
              false,
            );
          },
          undefined,
          [[EventName.historicalData, this.onHistoricalData]],
        )
        .pipe(map((v: { all: Bar[] }) => v.all)),
      {
        defaultValue: [],
      },
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
    WAP: number,
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
   * - 1 secs
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
    whatToShow: WhatToShow,
    formatDate: number,
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
            true,
          );
        },
        (reqId) => {
          this.api.cancelHistoricalData(reqId);
        },
        [[EventName.historicalDataUpdate, this.onHistoricalDataUpdate]],
        `${JSON.stringify(
          contract,
        )}:${barSizeSetting}:${whatToShow}:${formatDate}`, // Use the same instance ID each time to ensure there is only one pending request at a time.
      )
      .pipe(map((v: { all: Bar }) => v.all));
  }

  /** historicalTicks event handler */
  private readonly onHistoricalTicks = (
    subscriptions: Map<number, IBApiNextSubscription<HistoricalTick[]>>,
    reqId: number,
    ticks: HistoricalTick[],
    done: boolean,
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
   * @param useRTH Data from regular trading hours (true), or all available hours (false)
   */
  getHistoricalTicksMid(
    contract: Contract,
    startDateTime: string,
    endDateTime: string,
    numberOfTicks: number,
    useRTH: number | boolean,
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
            WhatToShow.MIDPOINT,
            useRTH,
            false,
          );
        },
        undefined,
        [[EventName.historicalTicks, this.onHistoricalTicks]],
      )
      .pipe(map((v: { all: HistoricalTick[] }) => v.all));
  }

  /** historicalTicksBidAsk event handler */
  private readonly onHistoricalTicksBidAsk = (
    subscriptions: Map<number, IBApiNextSubscription<HistoricalTickBidAsk[]>>,
    reqId: number,
    ticks: HistoricalTickBidAsk[],
    done: boolean,
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
   * @param useRTH Data from regular trading hours (true), or all available hours (false)
   * @param ignoreSize A filter only used when the source price is Bid_Ask
   */
  getHistoricalTicksBidAsk(
    contract: Contract,
    startDateTime: string,
    endDateTime: string,
    numberOfTicks: number,
    useRTH: number | boolean,
    ignoreSize: boolean,
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
            WhatToShow.BID_ASK,
            useRTH,
            ignoreSize,
          );
        },
        undefined,
        [[EventName.historicalTicksBidAsk, this.onHistoricalTicksBidAsk]],
      )
      .pipe(map((v: { all: HistoricalTickBidAsk[] }) => v.all));
  }

  /** historicalTicksLast event handler */
  private readonly onHistoricalTicksLast = (
    subscriptions: Map<number, IBApiNextSubscription<HistoricalTickLast[]>>,
    reqId: number,
    ticks: HistoricalTickLast[],
    done: boolean,
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
   * @param useRTH Data from regular trading hours (true), or all available hours (false)
   */
  getHistoricalTicksLast(
    contract: Contract,
    startDateTime: string,
    endDateTime: string,
    numberOfTicks: number,
    useRTH: number | boolean,
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
            WhatToShow.TRADES,
            useRTH,
            false,
          );
        },
        undefined,
        [[EventName.historicalTicksLast, this.onHistoricalTicksLast]],
      )
      .pipe(map((v: { all: HistoricalTickLast[] }) => v.all));
  }

  /** mktDepthExchanges event handler */
  private readonly onMktDepthExchanges = (
    subscriptions: Map<
      number,
      IBApiNextSubscription<DepthMktDataDescription[]>
    >,
    depthMktDataDescriptions: DepthMktDataDescription[],
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
          "getMarketDepthExchanges", // Use the same instance ID each time to ensure there is only one pending request at a time.
        )
        .pipe(map((v: { all: DepthMktDataDescription[] }) => v.all)),
      {
        defaultValue: [],
      },
    );
  }

  /** updateMktDepth event handler */
  private readonly onUpdateMktDepth = (
    subscriptions: Map<number, IBApiNextSubscription<OrderBook>>,
    reqId: number,
    position: number,
    operation: number,
    side: number,
    price: number,
    size: number,
  ): void => {
    // forward to L2 handler, but w/o market maker and smart depth set to false
    this.onUpdateMktDepthL2(
      subscriptions,
      reqId,
      position,
      undefined,
      operation,
      side,
      price,
      size,
      false,
    );
  };

  // mutable
  private insertAtMapIndex<T extends number, R>(
    index: number,
    key: T,
    value: R,
    map: Map<T, R>,
  ): Map<T, R> {
    const arr = Array.from(map);
    arr.splice(index, 0, [key, value]);
    map.clear();
    arr.forEach(([k, v]) => map.set(k, v));
    return map;
  }

  /** marketDepthL2 event handler */
  private readonly onUpdateMktDepthL2 = (
    subscriptions: Map<number, IBApiNextSubscription<OrderBook>>,
    reqId: number,
    position: number,
    marketMaker: string,
    operation: number,
    side: number,
    price: number,
    size: number,
    isSmartDepth: boolean,
  ): void => {
    // get subscription
    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    // update cached

    const cached = subscription.lastAllValue ?? {
      bids: new Map<OrderBookRowPosition, OrderBookRow>(),
      asks: new Map<OrderBookRowPosition, OrderBookRow>(),
    };

    const changed = {
      bids: new Map<OrderBookRowPosition, OrderBookRow>(),
      asks: new Map<OrderBookRowPosition, OrderBookRow>(),
    };

    let cachedRows: Map<OrderBookRowPosition, OrderBookRow> = undefined;
    let changedRows: Map<OrderBookRowPosition, OrderBookRow> = undefined;

    if (side == 0) {
      // ask side
      cachedRows = <Map<OrderBookRowPosition, OrderBookRow>>cached.asks; // eslint-disable-line @typescript-eslint/consistent-type-assertions
      changedRows = <Map<OrderBookRowPosition, OrderBookRow>>changed.asks; // eslint-disable-line @typescript-eslint/consistent-type-assertions
    } else if (side == 1) {
      // bid side
      cachedRows = <Map<OrderBookRowPosition, OrderBookRow>>cached.bids; // eslint-disable-line @typescript-eslint/consistent-type-assertions
      changedRows = <Map<OrderBookRowPosition, OrderBookRow>>changed.bids; // eslint-disable-line @typescript-eslint/consistent-type-assertions
    }

    if (cachedRows === undefined || changedRows === undefined) {
      this.logger.error(
        LOG_TAG,
        `onUpdateMktDepthL2: unknown side value ${side} received from TWS`,
      );
      return;
    }

    switch (operation) {
      case 0:
        // it's an insert

        this.insertAtMapIndex(
          position,
          position,
          {
            marketMaker: marketMaker,
            price: price,
            size: size,
            isSmartDepth: isSmartDepth,
          },
          cachedRows,
        );

        this.insertAtMapIndex(
          position,
          position,
          {
            marketMaker: marketMaker,
            price: price,
            size: size,
            isSmartDepth: isSmartDepth,
          },
          changedRows,
        );

        subscription.next({
          all: cached,
          added: changed,
        });
        break;

      case 1:
        // it's an update

        cachedRows.set(position, {
          marketMaker: marketMaker,
          price: price,
          size: size,
          isSmartDepth: isSmartDepth,
        });

        changedRows.set(position, {
          marketMaker: marketMaker,
          price: price,
          size: size,
          isSmartDepth: isSmartDepth,
        });

        subscription.next({
          all: cached,
          changed: changed,
        });

        break;

      case 2:
        // it's a delete
        {
          const deletedRow = cachedRows.get(position);

          cachedRows.delete(position);
          changedRows.set(position, deletedRow);

          subscription.next({
            all: cached,
            removed: changed,
          });
        }
        break;

      default:
        this.logger.error(
          LOG_TAG,
          `onUpdateMktDepthL2: unknown operation value ${operation} received from TWS`,
        );
        break;
    }
  };

  /**
   * Requests the contract's market depth (order book).
   *
   * This request must be direct-routed to an exchange and not smart-routed.
   *
   * The number of simultaneous market depth requests allowed in an account is calculated based on a formula
   * that looks at an accounts equity, commissions, and quote booster packs.
   *
   * @param contract The [[Contract]] for which the depth is being requested.
   * @param numRows The number of rows on each side of the order book.
   * @param isSmartDepth Flag indicates that this is smart depth request.
   * @param mktDepthOptions TODO document
   */
  getMarketDepth(
    contract: Contract,
    numRows: number,
    isSmartDepth: boolean,
    mktDepthOptions?: TagValue[],
  ): Observable<OrderBookUpdate> {
    return this.subscriptions.register<OrderBook>(
      (reqId) => {
        this.api.reqMktDepth(
          reqId,
          contract,
          numRows,
          isSmartDepth,
          mktDepthOptions,
        );
      },
      (reqId) => {
        this.api.cancelMktDepth(reqId, isSmartDepth);
      },
      [
        [EventName.updateMktDepth, this.onUpdateMktDepth],
        [EventName.updateMktDepthL2, this.onUpdateMktDepthL2],
      ],
      `${JSON.stringify(
        contract,
      )}:${numRows}:${isSmartDepth}:${mktDepthOptions}`, // Use the same instance ID each time to ensure there is only one pending request at a time.
    );
  }

  private readonly onScannerParameters = (
    subscriptions: Map<number, IBApiNextSubscription<string>>,
    xml: string,
  ): void => {
    subscriptions.forEach((sub) => {
      sub.next({ all: xml });
      sub.complete();
    });
  };

  /**
   * Requests an XML string that describes all possible scanner queries.
   */
  getScannerParameters(): Promise<string> {
    return lastValueFrom(
      this.subscriptions
        .register<string>(
          () => {
            this.api.reqScannerParameters();
          },
          undefined,
          [[EventName.scannerParameters, this.onScannerParameters]],
          "getScannerParameters", // Use the same instance ID each time to ensure there is only one pending request at a time.
        )
        .pipe(map((v: { all: string }) => v.all)),
      {
        defaultValue: "",
      },
    );
  }

  /**
   * Provides the data resulting from the market scanner request.
   * @param subscriptions
   * @param reqId the request's identifier
   * @param rank the ranking within the response of this bar.
   * @param contract the data's ContractDetails
   * @param distance according to query
   * @param benchmark according to query
   * @param projection according to query
   * @param legStr describes the combo legs when the scanner is returning EFP
   * @returns void
   */
  private readonly onScannerData = (
    subscriptions: Map<number, IBApiNextSubscription<MarketScannerRows>>,
    reqId: number,
    rank: number,
    contract: ContractDetails,
    distance: string,
    benchmark: string,
    projection: string,
    legStr: string,
  ): void => {
    // get subscription
    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    const item: MarketScannerItem = {
      rank,
      contract,
      distance,
      benchmark,
      projection,
      legStr,
    };

    const lastAllValue =
      subscription.lastAllValue ??
      new Map<MarketScannerItemRank, MarketScannerItem>();

    const existing = lastAllValue.get(rank) != undefined;
    lastAllValue.set(rank, item);
    if (subscription.endEventReceived) {
      const updated: MarketScannerRows = new Map<
        MarketScannerItemRank,
        MarketScannerItem
      >();
      updated.set(rank, item);
      subscription.next({
        all: lastAllValue,
        changed: existing ? updated : undefined,
        added: existing ? undefined : updated,
      });
    } else {
      subscription.lastAllValue = lastAllValue;
    }
  };

  /**
   * Indicates the scanner data reception has terminated.
   * @param subscriptions
   * @param reqId the request's identifier
   * @returns
   */
  private readonly onScannerDataEnd = (
    subscriptions: Map<number, IBApiNextSubscription<MarketScannerRows>>,
    reqId: number,
  ): void => {
    const subscription = subscriptions.get(reqId);
    if (!subscription) {
      return;
    }

    const lastAllValue =
      subscription.lastAllValue ??
      new Map<MarketScannerItemRank, MarketScannerItem>();
    const updated: IBApiNextItemListUpdate<MarketScannerRows> = {
      all: lastAllValue,
    };
    subscription.endEventReceived = true;
    subscription.next(updated);
  };

  /**
   * It returns an observable that will emit a list of scanner subscriptions.
   * @param {ScannerSubscription} scannerSubscription - ScannerSubscription
   * @param {TagValue[]} [scannerSubscriptionOptions] - An array of TagValue objects.
   * @param {TagValue[]} [scannerSubscriptionFilterOptions] - An optional array of TagValue objects.
   * @returns An observable that will emit a list of items.
   */
  getMarketScanner(
    scannerSubscription: ScannerSubscription,
    scannerSubscriptionOptions?: TagValue[],
    scannerSubscriptionFilterOptions?: TagValue[],
  ): Observable<MarketScannerUpdate> {
    return this.subscriptions.register<MarketScannerRows>(
      (reqId) => {
        this.api.reqScannerSubscription(
          reqId,
          scannerSubscription,
          scannerSubscriptionOptions,
          scannerSubscriptionFilterOptions,
        );
      },
      (reqId) => {
        this.api.cancelScannerSubscription(reqId);
      },
      [
        [EventName.scannerData, this.onScannerData],
        [EventName.scannerDataEnd, this.onScannerDataEnd],
      ],
    );
  }

  /** histogramData event handler */
  private readonly onHistogramData = (
    subscriptions: Map<number, IBApiNextSubscription<HistogramEntry[]>>,
    reqId: number,
    data: HistogramEntry[],
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
    durationUnit: DurationUnit,
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
              durationUnit,
            );
          },
          (reqId) => {
            this.api.cancelHistogramData(reqId);
          },
          [[EventName.histogramData, this.onHistogramData]],
          `getHistogramData+${JSON.stringify(
            contract,
          )}:${useRTH}:${duration}:${durationUnit}`, // Use the same instance ID each time to ensure there is only one pending request at a time.
        )
        .pipe(map((v: { all: HistogramEntry[] }) => v.all)),
      {
        defaultValue: [],
      },
    );
  }

  /**
   * Feeds in currently open orders.
   *
   * @param subscriptions listeners
   * @param orderId The order's unique id.
   * @param contract The order's [[Contract]]
   * @param order The currently active [[Order]]
   * @param orderState The order's [[OrderState]]
   *
   * @see [[placeOrder]], [[reqAllOpenOrders]], [[reqAutoOpenOrders]]
   */
  private readonly onOpenOrder = (
    subscriptions: Map<number, IBApiNextSubscription<OpenOrder[]>>,
    orderId: number,
    contract: Contract,
    order: Order,
    orderState: OrderState,
  ): void => {
    subscriptions.forEach((sub) => {
      const allOrders = sub.lastAllValue ?? [];
      const changeOrderIndex = allOrders.findIndex(
        (p) => p.order.permId == order.permId,
      );
      if (changeOrderIndex === -1) {
        // new open order - add it
        const addedOrder: OpenOrder = {
          orderId,
          contract,
          order,
          orderState,
          orderStatus: undefined,
        };
        allOrders.push(addedOrder);
        if (sub.endEventReceived) {
          sub.next({
            all: allOrders,
            added: [addedOrder],
          });
        } else {
          sub.lastAllValue = allOrders;
        }
      } else {
        // update
        const updatedOrder: OpenOrder = allOrders[changeOrderIndex];
        updatedOrder.order = order;
        updatedOrder.orderState = orderState;
        if (updatedOrder.orderStatus !== undefined) {
          // synchronize orderStatus if exists
          updatedOrder.orderStatus.clientId = order.clientId;
          updatedOrder.orderStatus.permId = order.permId;
          updatedOrder.orderStatus.parentId = order.parentId;
          updatedOrder.orderStatus.status = orderState.status;
        }
        sub.next({
          all: allOrders,
          changed: [updatedOrder],
        });
      }
    });
  };

  /**
   *  Ends the subscription once all openOrders are recieved
   *  @param subscriptions listeners
   */
  private readonly onOpenOrderComplete = (
    subscriptions: Map<number, IBApiNextSubscription<OpenOrder[]>>,
  ): void => {
    subscriptions.forEach((sub) => {
      const allOrders = sub.lastAllValue ?? [];
      sub.endEventReceived = true;
      sub.next({ all: allOrders });
      sub.complete();
    });
  };

  /**
   * Response to API bind order control message.
   *
   * @param subscriptions listeners
   * @param orderId permId (mistake from IB documentation, value is orderId not permId)
   * @param apiClientId API client id.
   * @param apiOrderId API order id.
   *
   * @see [[reqOpenOrders]]
   */
  private readonly onOrderBound = (
    // TODO finish implementation
    subscriptions: Map<number, IBApiNextSubscription<OpenOrder[]>>,
    orderId: number,
    apiClientId: number,
    apiOrderId: number,
  ): void => {
    /*
     * This is probably unused now.
     * Neither reqAllOpenOrders, reqAutoOpenOrders nor reqOpenOrders documentation reference this event.
     * Even getAutoOpenOrders(true) doesn't call it!
     */
    this.logger.warn(
      LOG_TAG,
      `Unexpected onOrderBound(${orderId}, ${apiClientId}, ${apiOrderId}) called.`,
    );
  };

  /**
   * Response to API status order control message.
   *
   * @param orderId the order's client id.
   * @param status the current status of the order. Possible values: PendingSubmit - indicates that you have transmitted the order, but have not yet received confirmation that it has been accepted by the order destination. PendingCancel - indicates that you have sent a request to cancel the order but have not yet received cancel confirmation from the order destination. At this point, your order is not confirmed canceled. It is not guaranteed that the cancellation will be successful. PreSubmitted - indicates that a simulated order type has been accepted by the IB system and that this order has yet to be elected. The order is held in the IB system until the election criteria are met. At that time the order is transmitted to the order destination as specified . Submitted - indicates that your order has been accepted by the system. ApiCancelled - after an order has been submitted and before it has been acknowledged, an API client client can request its cancelation, producing this state. Cancelled - indicates that the balance of your order has been confirmed canceled by the IB system. This could occur unexpectedly when IB or the destination has rejected your order. Filled - indicates that the order has been completely filled. Market orders executions will not always trigger a Filled status. Inactive - indicates that the order was received by the system but is no longer active because it was rejected or canceled.
   * @param filled number of filled positions.
   * @param remaining the remnant positions.
   * @param avgFillPrice average filling price.
   * @param permId the order's permId used by the TWS to identify orders.
   * @param parentId parent's id. Used for bracket and auto trailing stop orders.
   * @param lastFillPrice price at which the last positions were filled.
   * @param clientId API client which submitted the order.
   * @param whyHeld this field is used to identify an order held when TWS is trying to locate shares for a short sell. The value used to indicate this is 'locate'.
   * @param mktCapPrice If an order has been capped, this indicates the current capped price. Requires TWS 967+ and API v973.04+. Python API specifically requires API v973.06+.
   *
   * @see [[reqOpenOrders]]
   */
  private readonly onOrderStatus = (
    subscriptions: Map<number, IBApiNextSubscription<OpenOrder[]>>,
    orderId: number,
    status: OrderStatus,
    filled: number,
    remaining: number,
    avgFillPrice: number,
    permId?: number,
    parentId?: number,
    lastFillPrice?: number,
    clientId?: number,
    whyHeld?: string,
    mktCapPrice?: number,
  ): void => {
    const orderStatus = {
      status,
      filled,
      remaining,
      avgFillPrice: undefined,
      permId,
      parentId,
      lastFillPrice: undefined,
      clientId,
      whyHeld,
      mktCapPrice,
    };
    if (filled) {
      orderStatus.avgFillPrice = avgFillPrice;
      orderStatus.lastFillPrice = lastFillPrice;
    }
    subscriptions.forEach((sub) => {
      const allOrders = sub.lastAllValue ?? [];
      const changeOrderIndex = allOrders.findIndex(
        (p) => p.order.permId == permId,
      );
      if (changeOrderIndex !== -1) {
        const updatedOrder: OpenOrder = allOrders[changeOrderIndex];
        updatedOrder.orderStatus = orderStatus;
        updatedOrder.orderState.status = status;
        if (parentId !== undefined) updatedOrder.order.parentId = parentId;
        if (permId !== undefined) updatedOrder.order.permId = permId;
        if (clientId !== undefined) updatedOrder.order.clientId = clientId;
        sub.next({
          all: allOrders,
          changed: [updatedOrder],
        });
      } else {
        this.logger.warn(
          LOG_TAG,
          `onOrderStatus: non existent order ignored. orderId: ${orderId}, permId: ${permId}.`,
        );
      }
    });
  };

  /**
   *  Ends the subscription once all openOrders are recieved
   *  @param subscriptions listeners
   */
  private readonly onOpenOrderEnd = (
    subscriptions: Map<number, IBApiNextSubscription<OpenOrder[]>>,
  ): void => {
    // notify all subscribers
    subscriptions.forEach((subscription) => {
      const lastAllValue = subscription.lastAllValue ?? [];
      subscription.endEventReceived = true;
      subscription.next({ all: lastAllValue });
    });
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
            [EventName.orderStatus, this.onOrderStatus],
            [EventName.orderBound, this.onOrderBound],
            [EventName.openOrderEnd, this.onOpenOrderComplete],
          ],
          "getAllOpenOrders", // Use the same instance ID each time to ensure there is only one pending request at a time.
        )
        .pipe(map((v: { all: OpenOrder[] }) => v.all)),
      {
        defaultValue: [],
      },
    );
  }

  /**
   * Requests all open orders placed by this specific API client (identified by the API client id).
   * For client ID 0, this will bind previous manual TWS orders.
   */
  getOpenOrders(): Observable<OpenOrdersUpdate> {
    return this.subscriptions.register<OpenOrder[]>(
      () => {
        this.api.reqOpenOrders();
      },
      undefined,
      [
        [EventName.openOrder, this.onOpenOrder],
        [EventName.orderStatus, this.onOrderStatus],
        [EventName.orderBound, this.onOrderBound],
        [EventName.openOrderEnd, this.onOpenOrderEnd],
      ],
      "getOpenOrders", // Use the same instance ID each time to ensure there is only one pending request at a time.
    );
  }

  /**
   * Requests status updates AND (IB documentation not correct on this point) future orders placed from TWS. Can only be used with client ID 0.
   *
   * @param autoBind if set to `true`, the newly created orders will be assigned an API order ID and implicitly
   *   associated with this client. If set to `false, future orders will not be.
   *
   * @see [[reqAllOpenOrders]], [[reqOpenOrders]], [[cancelOrder]], [[reqGlobalCancel]]
   */
  getAutoOpenOrders(autoBind: boolean): Observable<OpenOrdersUpdate> {
    return this.subscriptions.register<OpenOrder[]>(
      () => {
        this.api.reqAutoOpenOrders(autoBind);
      },
      undefined,
      [
        [EventName.openOrder, this.onOpenOrder],
        [EventName.orderStatus, this.onOrderStatus],
        [EventName.orderBound, this.onOrderBound],
        [EventName.openOrderEnd, this.onOpenOrderEnd],
      ],
      "getAutoOpenOrders", // Use the same instance ID each time to ensure there is only one pending request at a time.
    );
  }

  /** nextValidId event handler */
  private readonly onNextValidId = (
    subscriptions: Map<number, IBApiNextSubscription<number>>,
    orderId: number,
  ): void => {
    // this is special to other one-shot callbacks:
    // we only want to complete one subscription at a time,
    // to avoid multiple getNextValidOrderId calls to return same value
    const next = subscriptions.entries().next();
    if (next && !next.done && next.value[1]) {
      next.value[1].next({
        all: orderId,
      });
      next.value[1].complete();
    }
  };

  /**
   * Requests the next valid order ID at the current moment.
   */
  getNextValidOrderId(): Promise<number> {
    return lastValueFrom(
      this.subscriptions
        .register<number>(
          () => {
            this.api.reqIds();
          },
          undefined,
          [[EventName.nextValidId, this.onNextValidId]],
        )
        .pipe(map((v: { all: number }) => v.all)),
      {
        defaultValue: -1,
      },
    );
  }

  /**
   * Places or modifies an order.
   * @param id The order's unique identifier.
   * Use a sequential id starting with the id received at the nextValidId method.
   * If a new order is placed with an order ID less than or equal to the order ID of a previous order an error will occur.
   * @param contract The order's [[Contract]].
   * @param order The [[Order]] object.
   */
  placeOrder(id: number, contract: Contract, order: Order): void {
    this.api.placeOrder(id, contract, order);
  }

  /**
   * Places new order.
   * This method does use the order id as returned by getNextValidOrderId() method and returns it as a result.
   * If you want to send multiple orders, consider using  placeOrder method instead and increase the order id manually for each new order, avoiding the overhead of calling getNextValidOrderId() for each.
   * @param contract The order's [[Contract]].
   * @param order The [[Order]] object.
   *  @see [[getNextValidOrderId]]
   */
  async placeNewOrder(contract: Contract, order: Order): Promise<number> {
    const orderId = await this.getNextValidOrderId();
    this.placeOrder(orderId, contract, order);
    return orderId;
  }

  /**
   * Places new order.
   * @param id The order's unique identifier.
   * @param contract The order's [[Contract]].
   * @param order The [[Order]] object.
   *
   */
  modifyOrder(id: number, contract: Contract, order: Order): void {
    this.api.placeOrder(id, contract, order);
  }

  /**
   * Cancels an active order placed by from the same API client ID.
   *
   * Note: API clients cannot cancel individual orders placed by other clients.
   * Use [[cancelAllOrders]] instead.
   *
   * @param orderId Specify which order should be cancelled by its identifier.
   * @param orderCancel Specify the time the order should be cancelled. An empty string will cancel the order immediately.
   */
  cancelOrder(orderId: number, orderCancel?: string | OrderCancel): void {
    this.api.cancelOrder(orderId, orderCancel);
  }

  /**
   * Cancels all active orders.
   * This method will cancel ALL open orders including those placed directly from TWS.
   *
   * @see [[cancelOrder]]
   */
  cancelAllOrders(orderCancel?: OrderCancel): void {
    this.api.reqGlobalCancel(orderCancel);
  }

  /**
   *  Ends the subscrition once all trades are recieved
   *  @param subscriptions
   *  @param reqId
   *  @param contract  Contract details that is used for order
   *  @param execution Execution details of an order
   */
  private readonly onExecDetails = (
    subscriptions: Map<number, IBApiNextSubscription<ExecutionDetail[]>>,
    reqId: number,
    contract: Contract,
    execution: Execution,
  ): void => {
    subscriptions.forEach((sub) => {
      const allTrades = sub.lastAllValue ?? [];
      allTrades.push({ reqId, contract, execution });
      sub.next({
        all: allTrades,
      });
    });
  };

  /**
   *  Ends the subscrition once all trades are recieved
   *  @param subscriptions
   */
  private readonly onExecDetailsEnd = (
    subscriptions: Map<
      number,
      IBApiNextSubscription<ExecutionDetail[] | CommissionReport[]>
    >,
    reqId: number,
  ): void => {
    const sub = subscriptions.get(reqId);
    if (!sub) {
      return;
    }
    if (!sub.lastAllValue) {
      sub.next({ all: [] });
    }
    sub.complete();
  };

  /** comissionReport event handler. */
  private readonly onComissionReport = (
    subscriptions: Map<number, IBApiNextSubscription<CommissionReport[]>>,
    commissionReport: CommissionReport,
  ): void => {
    subscriptions.forEach((sub) => {
      const commissionReports = sub.lastAllValue ?? [];
      commissionReports.push(commissionReport);
      sub.next({
        all: commissionReports,
      });
    });
  };

  /**
   * Get execution details of all executed trades.
   * @param filter  filter trade data on [[ExecutionFilter]]
   */
  getExecutionDetails(filter: ExecutionFilter): Promise<ExecutionDetail[]> {
    return lastValueFrom(
      this.subscriptions
        .register<ExecutionDetail[]>(
          (reqId) => {
            this.api.reqExecutions(reqId, filter);
          },
          undefined,
          [
            [EventName.execDetails, this.onExecDetails],
            [EventName.execDetailsEnd, this.onExecDetailsEnd],
          ],
        )
        .pipe(map((v: { all: ExecutionDetail[] }) => v.all)),
      {
        defaultValue: [],
      },
    );
  }

  /**
   * Get commissions reports details of all executed trades.
   * @param filter  filter trade data on [[ExecutionFilter]]
   */
  getCommissionReport(filter: ExecutionFilter): Promise<CommissionReport[]> {
    return lastValueFrom(
      this.subscriptions
        .register<CommissionReport[]>(
          (reqId) => {
            this.api.reqExecutions(reqId, filter);
          },
          undefined,
          [
            [EventName.commissionReport, this.onComissionReport],
            [EventName.execDetailsEnd, this.onExecDetailsEnd],
          ],
        )
        .pipe(map((v: { all: CommissionReport[] }) => v.all)),
      {
        defaultValue: [],
      },
    );
  }

  /** symbolSamples event handler. */
  private readonly onSymbolSamples = (
    subscriptions: Map<number, IBApiNextSubscription<ContractDescription[]>>,
    reqId: number,
    contractDescriptions: ContractDescription[],
  ): void => {
    const sub = subscriptions.get(reqId);
    subscriptions.delete(reqId);
    sub?.next({
      all: contractDescriptions,
    });
    sub?.complete();
  };

  /**
   * Search contracts where name or symbol matches the given text pattern.
   *
   * @param pattern Either start of ticker symbol or (for larger strings) company name.
   */
  getMatchingSymbols(pattern: string): Promise<ContractDescription[]> {
    return lastValueFrom(
      this.subscriptions
        .register<ContractDescription[]>(
          (reqId) => {
            this.api.reqMatchingSymbols(reqId, pattern);
          },
          undefined,
          [[EventName.symbolSamples, this.onSymbolSamples]],
        )
        .pipe(map((v: { all: ContractDescription[] }) => v.all)),
    );
  }
  /** @deprecated use getMatchingSymbols instead */
  searchContracts = this.getMatchingSymbols;

  /** userInfo event handler. */
  private readonly onUserInfo = (
    subscriptions: Map<number, IBApiNextSubscription<string>>,
    reqId: number,
    whiteBrandingId: string,
  ): void => {
    const sub = subscriptions.get(reqId);
    subscriptions.delete(reqId);
    sub?.next({
      all: whiteBrandingId,
    });
    sub?.complete();
  };

  /**
   * Get the user info of the logged user.
   */
  getUserInfo(): Promise<string> {
    return lastValueFrom(
      this.subscriptions
        .register<string>(
          (reqId) => {
            this.api.reqUserInfo(reqId);
          },
          undefined,
          [[EventName.userInfo, this.onUserInfo]],
          "getUserInfo",
        )
        .pipe(map((v: { all: string }) => v.all)),
      {
        defaultValue: undefined,
      },
    );
  }

  /** marketRule event handler. */
  private readonly onMarketRule = (
    subscriptions: Map<number, IBApiNextSubscription<PriceIncrement[]>>,
    marketRuleId: number,
    priceIncrements: PriceIncrement[],
  ): void => {
    filterMap(
      subscriptions,
      (_k: number, v: IBApiNextSubscription<PriceIncrement[]>) =>
        v.instanceId === `getMarketRule+${marketRuleId}`,
    ).forEach((sub) => {
      sub.next({ all: priceIncrements });
      sub.complete();
    });
  };

  /**
   * Get details about a given market rule.
   * The market rule for an instrument on a particular exchange provides details about how the minimum price increment
   * changes with price. A list of market rule ids can be obtained by invoking reqContractDetails on a particular
   * contract. The returned market rule ID list will provide the market rule ID for the instrument in the correspond
   * valid exchange list in contractDetails.
   *
   * @param marketRuleId The id of market rule.
   */
  getMarketRule(marketRuleId: number): Promise<PriceIncrement[]> {
    return lastValueFrom(
      this.subscriptions
        .register<PriceIncrement[]>(
          () => {
            this.api.reqMarketRule(marketRuleId);
          },
          undefined,
          [[EventName.marketRule, this.onMarketRule]],
          `getMarketRule+${marketRuleId}`,
        )
        .pipe(map((v: { all: PriceIncrement[] }) => v.all)),
      {
        defaultValue: undefined,
      },
    );
  }

  /** TickByTickAllLastDataUpdates event handler */
  private readonly onTickByTickAllLastDataUpdates =
    (contract: Contract) =>
    (
      subscriptions: Map<number, IBApiNextSubscription<TickByTickAllLast>>,
      reqId: number,
      tickType: number,
      time: string,
      price: number,
      size: number,
      tickAttribLast: TickAttribLast,
      exchange: string,
      specialConditions: string,
    ): void => {
      // get subscription

      const subscription = subscriptions.get(reqId);
      if (!subscription) {
        return;
      }

      // update tick by tick all last

      const current = subscription.lastAllValue ?? ({} as TickByTickAllLast);
      current.tickType = tickType;
      current.time = !time ? undefined : +time;
      current.price = price !== -1 ? price : undefined;
      current.size = size !== -1 ? size : undefined;
      current.tickAttribLast = tickAttribLast;
      current.exchange = exchange;
      current.specialConditions = specialConditions;
      current.contract = contract;
      subscription.next({ all: current });
    };

  /**
   * Create a subscription to receive tick-by-tick last or all last price data updates.
   *
   * Use {@link IBApiNext.getHistoricalTicksLast} to receive historical last tick data and this function if you
   * want to receive real-time tick-by-tick last or all last price data updates.
   *
   * @see https://interactivebrokers.github.io/tws-api/tick_data.html for details
   *
   * @param contract The contract for which we want to retrieve the data.
   * @param numberOfTicks The number of ticks to retrieve.
   * @param ignoreSize If true, the size of the tick will be ignored.
   */
  getTickByTickAllLastDataUpdates(
    contract: Contract,
    numberOfTicks: number = 0,
    ignoreSize: boolean = false,
  ): Observable<TickByTickAllLast> {
    return this.subscriptions
      .register<TickByTickAllLast>(
        (reqId) => {
          this.api.reqTickByTickData(
            reqId,
            contract,
            TickByTickDataType.Last,
            numberOfTicks,
            ignoreSize,
          );
        },
        (reqId) => {
          this.api.cancelTickByTickData(reqId);
        },
        [
          [
            EventName.tickByTickAllLast,
            this.onTickByTickAllLastDataUpdates(contract),
          ],
        ],
        `${JSON.stringify(contract)}:${numberOfTicks}:${ignoreSize}`, // Use the same instance ID each time to ensure there is only one pending request at a time.
      )
      .pipe(map((v: { all: TickByTickAllLast }) => v.all));
  }

  private readonly onFundamentalData = (
    subscriptions: Map<number, IBApiNextSubscription<string>>,
    reqId: number,
    data: string,
  ): void => {
    const sub = subscriptions.get(reqId);
    subscriptions.delete(reqId);
    sub?.next({ all: data });
    sub?.complete();
  };

  /**
   * Get the fundamental data of a contract.
   * @param contract The contract's description for which the data will be returned.
   * @param reportType there are three available report types:
   * - ReportSnapshot: Company overview.
   * - ReportsFinSummary: Financial summary.
   * - ReportRatios: Financial ratios.
   * - ReportsFinStatements: Financial statements.
   * - RESC: Analyst estimates.
   * @param fundamentalDataOptions The fundamental data options for which we want to retrieve the data.
   */
  getFundamentalData(
    contract: Contract,
    reportType: string,
    fundamentalDataOptions: TagValue[] = [],
  ): Promise<string> {
    return lastValueFrom(
      this.subscriptions
        .register<string>(
          (reqId) => {
            this.api.reqFundamentalData(
              reqId,
              contract,
              reportType,
              fundamentalDataOptions,
            );
          },
          (reqId) => {
            this.api.cancelFundamentalData(reqId);
          },
          [[EventName.fundamentalData, this.onFundamentalData]],
        )
        .pipe(map((v: { all: string }) => v.all)),
      {
        defaultValue: undefined,
      },
    );
  }
}
