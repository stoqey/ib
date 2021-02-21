import {
  IBApiError,
  IBApiAutoConnection,
  AccountSummaries,
  AccountSummaryValues,
  ConnectionState,
  MarketDataType,
  Position,
  PnL,
  TickType,
  IBApiTickType,
  IBApiNextTickType,
} from ".";
import {
  IBApiCreationOptions,
  EventName,
  ErrorCode,
  Contract,
  ContractDetails,
} from "..";
import { IBApiNextSubscription } from "./internal/subscription";
import { Observable, Subject } from "rxjs";
import { take } from "rxjs/operators";
import { PnLSingle } from "./account/pnl-single";
import { undefineMax } from "../common/helper";
import { IBApiNextLogger } from "./internal/logger";
import LogLevel from "../api/data/enum/log-level";

/** An invalid request id. */
const INVALID_REQ_ID = -1;

/** The log tag. */
const LOG_TAG = "IBApiNext";

/**
 * Next-gen Typescript implementation of the Interactive Brokers TWS (or IB Gateway) API.
 *
 * If you prefer to stay as close as possible to the official TWS API interfaces and functionality,
 * use [[IBApi]].
 *
 * If you prefer to use an API that provides some more convenience functions, such as auto-reconnect
 * or rxjs Observables that stay functional during re-connect, use [[IBApiNext]].
 *
 */
export class IBApiNext {
  /**
   * Create an [[IBApiNext]] object.
   *
   * @param reconnectInterval The auto-reconnect interval in milliseconds.
   * If set to 0, auto-reconnect is disabled.
   * @param options Creation options.
   */
  constructor(reconnectInterval: number, options?: IBApiCreationOptions) {
    // create IBApiAutoConnection object

    this.api = new IBApiAutoConnection(reconnectInterval, options, this.logger);

    // setup error event handler

    this.api.on(
      EventName.error,
      (error: Error, code: ErrorCode, reqId: number) => {
        const apiError: IBApiError = { error, code, reqId };
        // emit to the subscription subject
        if (reqId !== INVALID_REQ_ID) {
          this.subscriptions.get(reqId).error(apiError);
        }
        // emit to global error subject
        this.errorSubject.next(apiError);
      }
    );

    // setup TWS server version event handler

    this.api.on(EventName.server, (version, connectionTime) => {
      this.logger.logInfo(
        "TWS",
        `Server Version: ${version}. Connection time ${connectionTime}`
      );
    });

    // setup TWS info message event handler

    this.api.on(EventName.info, (message: string) => {
      this.logger.logInfo("TWS", message);
    });
  }

  /** The [[IBApiNextLogger]] instance. */
  private readonly logger = new IBApiNextLogger();

  /** The [[IBApi]] with auto-reconnect. */
  private readonly api: IBApiAutoConnection;

  /** List of all active subscriptions, with request id as key. */
  private readonly subscriptions = new Map<
    number,
    IBApiNextSubscription<unknown>
  >();

  /** A list of registered event handlers (to avoid that same handler is registered multiple times). */
  private readonly eventHandlers = new Set<EventName>();

  /**
   * Register an event handler.
   *
   * @param registrationCallback Callback that is invoked to execute the
   * event handler registration code. It will not be called if an event handler for
   * the given event name already exists.
   */
  private registerEventHandler(
    eventName: EventName,
    listener: (...args: unknown[]) => void
  ): void {
    if (this.eventHandlers.has(eventName)) {
      return;
    }
    this.api.addListener(eventName, listener);
    this.eventHandlers.add(eventName);
  }

  /**
   * The IBApi error [[Subject]].
   *
   * All errors from [[IBApi]] error events will be sent to this subject.
   */
  public readonly errorSubject = new Subject<IBApiError>();

  /** The last used request id. */
  private static lastUsedRedId = 0;

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
  get error(): Observable<IBApiError> {
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
   * Get the next unused request id.
   */
  get nextReqId(): number {
    return ++IBApiNext.lastUsedRedId;
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
    this.logger.logDebug(LOG_TAG, `connect(${clientId})`);
    this.api.connect(clientId);
    return this;
  }

  /**
   * Disconnect from the TWS or IB Gateway.
   *
   * Use [[connectionState]] for observing the connection state.
   */
  disconnect(): IBApiNext {
    this.logger.logDebug(LOG_TAG, "disconnect()");
    this.api.disconnect();
    return this;
  }

  /**
   * Get TWS's current time.
   */
  getCurrentTime(): Promise<number> {
    const requestIds = new Set<number>();

    // register event handlers

    const onCurrentTime = (time: number): void => {
      requestIds.forEach((id) => this.subscriptions.get(id).next(true, time));
    };

    this.registerEventHandler(EventName.currentTime, onCurrentTime);

    // create the subscription

    return new IBApiNextSubscription<number>(
      this,
      this.subscriptions,
      (reqId) => {
        requestIds.add(reqId);
        this.api.reqCurrentTime();
      },
      (reqId) => {
        requestIds.delete(reqId);
      }
    )
      .createObservable()
      .pipe(take(1))
      .toPromise();
  }

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
   * @param incrementalUpdates Set to true to enable incremental updates, or false to disable it.
   */
  getAccountSummary(
    group: string,
    tags: string,
    incrementalUpdates: boolean
  ): Observable<AccountSummaries> {
    // accountSummary event handler

    const onAccountSummary = (
      reqId: number,
      account: string,
      tag: string,
      value: string,
      currency: string
    ): void => {
      // get the subscription

      const subscription = this.subscriptions.get(
        reqId
      ) as IBApiNextSubscription<AccountSummaries>;
      if (!subscription) {
        return;
      }

      // update cache

      const allSummaries = subscription.value ?? new AccountSummaries();
      allSummaries.getOrAdd(account).values.set(tag, { value, currency });
      subscription.cache(allSummaries);

      // deliver to subject

      if (!subscription.endEventReceived) {
        return;
      }

      subscription.next(
        false,
        incrementalUpdates
          ? new AccountSummaries([
              [
                account,
                {
                  account,
                  values: new AccountSummaryValues([
                    [tag, { value, currency }],
                  ]),
                },
              ],
            ])
          : allSummaries
      );
    };

    // accountSummaryEnd event handler

    const onAccountSummaryEnd = (reqId: number): void => {
      // get the subscription

      const subscription = this.subscriptions.get(
        reqId
      ) as IBApiNextSubscription<AccountSummaries>;
      if (!subscription) {
        return;
      }

      // signal end event and deliver cache to subject

      subscription.endEventReceived = true;
      subscription.next(false, subscription.value);
    };

    // register event handlers

    this.registerEventHandler(EventName.accountSummary, onAccountSummary);
    this.registerEventHandler(EventName.accountSummaryEnd, onAccountSummaryEnd);

    // create the subscription

    return new IBApiNextSubscription<AccountSummaries>(
      this,
      this.subscriptions,
      (reqId) => {
        this.api.reqAccountSummary(reqId, group, tags);
      },
      (reqId) => {
        this.api.cancelAccountSummary(reqId);
      }
    ).createObservable();
  }

  /**
   * Create subscription to receive the positions on all accessible accounts.
   *
   * All positions are sent on the first event.
   * Use incrementalUpdates argument to switch between incremental or full update mode.
   * With incremental updates, only changed positions will be sent after the initial complete list.
   * If a positions is closed, the positions size will be 0.
   * Without incremental updates, the complete list of positions will be sent again if any of it has changed.
   *
   * @param incrementalUpdates Set to true to enable incremental updates, or false to disable it.
   */
  getPositions(incrementalUpdates: boolean): Observable<Position[]> {
    const requestIds = new Set<number>();

    // position event handler

    const onPosition = (
      account: string,
      contract: Contract,
      pos: number,
      avgCost: number
    ): void => {
      const updatedPosition: Position = { account, contract, pos, avgCost };
      requestIds.forEach((id) => {
        // get subscription

        const subscription = this.subscriptions.get(
          id
        ) as IBApiNextSubscription<Position[]>;
        if (!subscription) {
          return;
        }

        // update cache

        const allPositions = subscription.value ?? [];

        const changePositionIndex = allPositions.findIndex(
          (p) => p.account === account && p.contract.conId == contract.conId
        );
        if (changePositionIndex === -1) {
          // new position - add it
          allPositions.push(updatedPosition);
        } else {
          if (!updatedPosition.pos) {
            // remove zero size position
            allPositions.splice(changePositionIndex);
          } else {
            // update position
            allPositions[changePositionIndex] = updatedPosition;
          }
        }

        subscription.cache(allPositions);

        // deliver to subject

        if (!subscription.endEventReceived) {
          return;
        }

        subscription.next(
          false,
          incrementalUpdates ? [updatedPosition] : allPositions
        );
      });
    };

    // positionEnd event handler

    const onPositionEnd = (): void => {
      requestIds.forEach((id) => {
        // get the subscription

        const subscription = this.subscriptions.get(
          id
        ) as IBApiNextSubscription<Position[]>;
        if (!subscription) {
          return;
        }

        // signal end event and deliver cache to subject

        subscription.endEventReceived = true;
        subscription.next(false, subscription.value);
      });
    };

    // register event handlers

    this.registerEventHandler(EventName.position, onPosition);
    this.registerEventHandler(EventName.positionEnd, onPositionEnd);

    // create the subscription

    return new IBApiNextSubscription<Position[]>(
      this,
      this.subscriptions,
      (reqId) => {
        requestIds.add(reqId);
        this.api.reqPositions();
      },
      (reqId) => {
        this.api.cancelPositions();
        requestIds.delete(reqId);
      }
    ).createObservable();
  }

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
  getContractDetails(contract: Contract): Promise<ContractDetails[]> {
    // contractDetails event handler

    const onContractDetails = (id: number, details: ContractDetails) => {
      // get subscription

      const subscription = this.subscriptions.get(id) as IBApiNextSubscription<
        ContractDetails[]
      >;
      if (!subscription) {
        return;
      }

      // update cache

      const allContractDetails = subscription.value ?? [];
      allContractDetails.push(details);
      subscription.cache(allContractDetails);
    };

    // contractDetailsEnd event handler

    const onContractDetailsEnd = (id: number) => {
      // get subscription

      const subscription = this.subscriptions.get(id) as IBApiNextSubscription<
        ContractDetails[]
      >;
      if (!subscription) {
        return;
      }

      // deliver cache to subject and clear it

      subscription.next(false, subscription.value);
      subscription.cache([]);
    };

    // register event handler

    this.registerEventHandler(EventName.contractDetails, onContractDetails);
    this.registerEventHandler(
      EventName.contractDetailsEnd,
      onContractDetailsEnd
    );

    // create the subscription

    return new IBApiNextSubscription<ContractDetails[]>(
      this,
      this.subscriptions,
      (reqId) => {
        this.api.reqContractDetails(reqId, contract);
      },
      () => {
        return;
      }
    )
      .createObservable()
      .pipe(take(1))
      .toPromise();
  }

  /**
   * Create a subscription to receive real time daily PnL and unrealized PnL updates.
   *
   * @param account Account for which to receive PnL updates.
   * @param modelCode Specify to request PnL updates for a specific model.
   */
  getPnL(account: string, model?: string): Observable<PnL> {
    // register event handler

    const onPnL = (
      reqId: number,
      dailyPnL: number,
      unrealizedPnL: number,
      realizedPnL: number
    ) => {
      // get subscription

      const subscription = this.subscriptions.get(
        reqId
      ) as IBApiNextSubscription<PnL>;
      if (!subscription) {
        return;
      }

      // deliver value to subject

      subscription.next(true, {
        dailyPnL: undefineMax(dailyPnL),
        unrealizedPnL: undefineMax(unrealizedPnL),
        realizedPnL: undefineMax(realizedPnL),
      });
    };

    this.registerEventHandler(EventName.pnl, onPnL);

    // create the subscription

    return new IBApiNextSubscription<PnL>(
      this,
      this.subscriptions,
      (reqId) => {
        this.api.reqPnL(reqId, account, model);
      },
      () => {
        return;
      }
    ).createObservable();
  }

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
    // register event handler

    const pnlSingleHandler = (
      reqId: number,
      pos: number,
      dailyPnL: number,
      unrealizedPnL: number,
      realizedPnL: number,
      value: number
    ) => {
      // get subscription

      const subscription = this.subscriptions.get(
        reqId
      ) as IBApiNextSubscription<PnLSingle>;
      if (!subscription) {
        return;
      }

      // deliver value to subject

      subscription.next(true, {
        position: pos,
        dailyPnL: undefineMax(dailyPnL),
        unrealizedPnL: undefineMax(unrealizedPnL),
        realizedPnL: undefineMax(realizedPnL),
        marketValue: undefineMax(value),
      });
    };

    this.registerEventHandler(EventName.pnlSingle, pnlSingleHandler);

    // create the subscription

    return new IBApiNextSubscription<PnL>(
      this,
      this.subscriptions,
      (reqId) => {
        this.api.reqPnLSingle(reqId, account, modelCode, conId);
      },
      (reqId) => {
        this.api.cancelPnLSingle(reqId);
      }
    ).createObservable();
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
  ): Observable<MarketData> {
    // tickPrice, tickSize and tickGeneric event handler

    const onTickHandler = (
      id: number,
      tickType: IBApiTickType,
      value: number
    ): void => {
      // filter -1 on Bid/Ask and Number.MAX_VALUE.

      if (
        value === -1 &&
        (tickType === IBApiTickType.BID ||
          tickType === IBApiTickType.DELAYED_BID ||
          tickType === IBApiTickType.ASK ||
          tickType === IBApiTickType.DELAYED_ASK)
      ) {
        value = Number.MAX_VALUE;
      }
      if (value === Number.MAX_VALUE) {
        return;
      }

      // get subscription

      const subscription = this.subscriptions.get(
        id
      ) as IBApiNextSubscription<MarketData>;
      if (!subscription) {
        return;
      }

      // update cache

      const allMarketData = subscription.value ?? new MarketData();
      allMarketData.set(tickType, value);
      subscription.cache(allMarketData);

      // deliver to subject

      subscription.next(false, new MarketData([[tickType, value]]));
    };

    // tickOptionComputationHandler event handler

    const onTickOptionComputationHandler = (
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
    ): void => {
      // get subscription

      const subscription = this.subscriptions.get(
        id
      ) as IBApiNextSubscription<MarketData>;
      if (!subscription) {
        return;
      }

      // generate [[IBApiNext]] market data ticks

      const ticks: [TickType, number | undefined][] = [
        [IBApiNextTickType.OPTION_UNDERLYING, undPrice],
        [IBApiNextTickType.OPTION_PV_DIVIDEND, pvDividend],
      ];
      switch (field) {
        case IBApiTickType.BID_OPTION:
          ticks.push(
            [IBApiNextTickType.BID_OPTION_IV, impliedVolatility],
            [IBApiNextTickType.BID_OPTION_DELTA, delta],
            [IBApiNextTickType.BID_OPTION_PRICE, optPrice],
            [IBApiNextTickType.BID_OPTION_GAMMA, gamma],
            [IBApiNextTickType.BID_OPTION_VEGA, vega],
            [IBApiNextTickType.BID_OPTION_THETA, theta]
          );
          break;
        case IBApiTickType.DELAYED_BID_OPTION:
          ticks.push(
            [IBApiNextTickType.DELAYED_BID_OPTION_IV, impliedVolatility],
            [IBApiNextTickType.DELAYED_BID_OPTION_DELTA, delta],
            [IBApiNextTickType.DELAYED_BID_OPTION_PRICE, optPrice],
            [IBApiNextTickType.DELAYED_BID_OPTION_GAMMA, gamma],
            [IBApiNextTickType.DELAYED_BID_OPTION_VEGA, vega],
            [IBApiNextTickType.DELAYED_BID_OPTION_THETA, theta]
          );
          break;
        case IBApiTickType.ASK_OPTION:
          ticks.push(
            [IBApiNextTickType.ASK_OPTION_IV, impliedVolatility],
            [IBApiNextTickType.ASK_OPTION_DELTA, delta],
            [IBApiNextTickType.ASK_OPTION_PRICE, optPrice],
            [IBApiNextTickType.ASK_OPTION_GAMMA, gamma],
            [IBApiNextTickType.ASK_OPTION_VEGA, vega],
            [IBApiNextTickType.ASK_OPTION_THETA, theta]
          );
          break;
        case IBApiTickType.DELAYED_ASK_OPTION:
          ticks.push(
            [IBApiNextTickType.DELAYED_ASK_OPTION_IV, impliedVolatility],
            [IBApiNextTickType.DELAYED_ASK_OPTION_DELTA, delta],
            [IBApiNextTickType.DELAYED_ASK_OPTION_PRICE, optPrice],
            [IBApiNextTickType.DELAYED_ASK_OPTION_GAMMA, gamma],
            [IBApiNextTickType.DELAYED_ASK_OPTION_VEGA, vega],
            [IBApiNextTickType.DELAYED_ASK_OPTION_THETA, theta]
          );
          break;
        case IBApiTickType.LAST_OPTION:
          ticks.push(
            [IBApiNextTickType.LAST_OPTION_IV, impliedVolatility],
            [IBApiNextTickType.LAST_OPTION_DELTA, delta],
            [IBApiNextTickType.LAST_OPTION_PRICE, optPrice],
            [IBApiNextTickType.LAST_OPTION_GAMMA, gamma],
            [IBApiNextTickType.LAST_OPTION_VEGA, vega],
            [IBApiNextTickType.LAST_OPTION_THETA, theta]
          );
          break;
        case IBApiTickType.DELAYED_LAST_OPTION:
          ticks.push(
            [IBApiNextTickType.DELAYED_LAST_OPTION_IV, impliedVolatility],
            [IBApiNextTickType.DELAYED_LAST_OPTION_DELTA, delta],
            [IBApiNextTickType.DELAYED_LAST_OPTION_PRICE, optPrice],
            [IBApiNextTickType.DELAYED_LAST_OPTION_GAMMA, gamma],
            [IBApiNextTickType.DELAYED_LAST_OPTION_VEGA, vega],
            [IBApiNextTickType.DELAYED_LAST_OPTION_THETA, theta]
          );
          break;
        case IBApiTickType.MODEL_OPTION:
          ticks.push(
            [IBApiNextTickType.MODEL_OPTION_IV, impliedVolatility],
            [IBApiNextTickType.MODEL_OPTION_DELTA, delta],
            [IBApiNextTickType.MODEL_OPTION_PRICE, optPrice],
            [IBApiNextTickType.MODEL_OPTION_GAMMA, gamma],
            [IBApiNextTickType.MODEL_OPTION_VEGA, vega],
            [IBApiNextTickType.MODEL_OPTION_THETA, theta]
          );
          break;
        case IBApiTickType.DELAYED_MODEL_OPTION:
          ticks.push(
            [IBApiNextTickType.DELAYED_MODEL_OPTION_IV, impliedVolatility],
            [IBApiNextTickType.DELAYED_MODEL_OPTION_DELTA, delta],
            [IBApiNextTickType.DELAYED_MODEL_OPTION_PRICE, optPrice],
            [IBApiNextTickType.DELAYED_MODEL_OPTION_GAMMA, gamma],
            [IBApiNextTickType.DELAYED_MODEL_OPTION_VEGA, vega],
            [IBApiNextTickType.DELAYED_MODEL_OPTION_THETA, theta]
          );
          break;
      }

      // update cache

      const allMarketData = subscription.value ?? new MarketData();

      const filteredTicks = new Map<TickType, number>();
      ticks.forEach((tick) => {
        const value = undefineMax(tick[1]);
        if (value !== undefined) {
          allMarketData.set(tick[0], value);
          filteredTicks.set(tick[0], value);
        }
      });

      subscription.cache(allMarketData);

      // deliver to subject

      subscription.next(false, filteredTicks);
    };

    // register event handler

    this.registerEventHandler(EventName.tickPrice, onTickHandler);
    this.registerEventHandler(EventName.tickSize, onTickHandler);
    this.registerEventHandler(EventName.tickGeneric, onTickHandler);
    this.registerEventHandler(
      EventName.tickOptionComputation,
      onTickOptionComputationHandler
    );

    // create the subscription

    return new IBApiNextSubscription<MarketData>(
      this,
      this.subscriptions,
      (tickerId) => {
        this.api.reqMktData(
          tickerId,
          contract,
          genericTickList,
          snapshot,
          regulatorySnapshot
        );
      },
      (tickerId) => {
        // when using snapshot, cancel will cause a "Can't find EId with tickerId" error.
        if (!snapshot) {
          this.api.cancelMktData(tickerId);
        }
      }
    ).createObservable();
  }
}

/** A market data tick on [[IBApiNext]]. */
export class MarketData extends Map<TickType, number> {
  constructor(init?: [TickType, number][]) {
    super(init);
  }
}
