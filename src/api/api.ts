import { EventEmitter } from "eventemitter3";

import { Controller } from "../core/io/controller";
import { Contract } from "./contract/contract";
import { ContractDescription } from "./contract/contractDescription";
import { ContractDetails } from "./contract/contractDetails";
import { DeltaNeutralContract } from "./contract/deltaNeutralContract";
import DepthMktDataDescription from "./data/container/depth-mkt-data-description";
import FamilyCode from "./data/container/family-code";
import NewsProvider from "./data/container/news-provider";
import SoftDollarTier from "./data/container/soft-dollar-tier";
import TagValue from "./data/container/tag-value";
import { EventName } from "./data/enum/event-name";
import FADataType from "./data/enum/fad-data-type";
import LogLevel from "./data/enum/log-level";
import MIN_SERVER_VER from "./data/enum/min-server-version";
import OptionExerciseAction from "./data/enum/option-exercise-action";
import { ErrorCode } from "../common/errorCode";
import { HistogramEntry } from "./historical/histogramEntry";
import { HistoricalTick } from "./historical/historicalTick";
import { HistoricalTickBidAsk } from "./historical/historicalTickBidAsk";
import { HistoricalTickLast } from "./historical/historicalTickLast";
import { ScannerSubscription } from "./market/scannerSubscription";
import { TickByTickDataType } from "./market/tickByTickDataType";
import { TickType } from "./market/tickType";
import { Execution } from "./order/execution";
import { Order } from "./order/order";
import { OrderState } from "./order/orderState";
import { CommissionReport } from "./report/commissionReport";
import { ExecutionFilter } from "./report/executionFilter";

/**
 * Input arguments on the [[IBApi]] class constructor.
 */
export interface IBApiCreationOptions {
  /**
   * Hostname of the TWS (or IB Gateway).
   *
   * Default is 'localhost'.
   */
  host?: string;

  /**
   * Hostname of the TWS (or IB Gateway).
   *
   * Default is 7496, which is the TWS default (4001 is default for IB Gateway Live-Accounts and 4002 for Demo-Accounts).
   */
  port?: number;

  /**
   * A unique client id (per TWS or IB Gateway instance).
   *
   * Default is 0.
   *
   * @deprecated The attributes should not be used anymore.
   * Use clientId argument [[IBApi.connect]] instead.
   */
  clientId?: number;

  /**
   * Max. number of requests per second, sent to TWS/IB Gateway.
   * Default is 40. IB specifies 50 requests/s as maximum.
   *
   * Note that sending large amount of requests within a small amount of time, significantly increases resource
   * consumption of the TWS/IB Gateway (especially memory consumption). If you experience any lags, hangs or crashes
   * on TWS/IB Gateway while sending request bursts, try to reduce this value.
   */
  maxReqPerSec?: number;
}

/** Maximum supported version. */
export const MAX_SUPPORTED_SERVER_VERSION = MIN_SERVER_VER.PRICE_MGMT_ALGO;

/** Minimum supported version. */
export const MIN_SERVER_VER_SUPPORTED = 38;

/**
 * Typescript implementation of the Interactive Brokers TWS (or IB Gateway) API.
 *
 * Refer to the official {@link https://interactivebrokers.github.io/tws-api/|Trader Workstation API documentation} for details.
 */
export class IBApi extends EventEmitter {
  /**
   * Create a IB API object.
   *
   * @param options Creation options.
   */
  constructor(options?: IBApiCreationOptions) {
    super();
    this.controller = new Controller(this, options);
  }

  /** The I/O queue controller object. */
  private controller: Controller; // TODO replace with Controller type as soon as available

  /**
   * Get the IB API Server version.
   *
   * @see [[MIN_SERVER_VER]]
   */
  get serverVersion(): number {
    return this.controller.serverVersion;
  }

  /**
   * Returns `true` if currently connected to server, `false` otherwise.
   */
  get isConnected(): boolean {
    return this.controller.connected;
  }

  /**
   * Allows to switch between different current (V100+) and previous connection mechanisms.
   *
   * @deprecated pre-V100 support will be removed. Please consider updating your
   * TWS and/or IB Gateway version.
   */
  disableUseV100Plus(): void {
    return this.controller.disableUseV100Plus();
  }

  /**
   * Connect to the TWS or IB Gateway.
   *
   * @param clientId A unique client id (per TWS or IB Gateway instance).
   * When not specified, the client id from [[IBApiCreationOptions]] or the default client id (0) will used.
   */
  connect(clientId?: number): IBApi {
    this.controller.connect(clientId);
    return this;
  }

  /**
   * Disconnect from the TWS or IB Gateway.
   */
  disconnect(): IBApi {
    this.controller.disconnect();
    return this;
  }

  /**
   * Calculate the volatility for an option.
   * Request the calculation of the implied volatility based on hypothetical option and its underlying prices.
   * The calculation will be emitted as tickOptionComputation event.
   *
   * @param reqId Unique identifier of the request.
   * @param contract The option's contract for which the volatility wants to be calculated.
   * @param optionPrice Hypothetical option price.
   * @param underPrice Hypothetical option's underlying price.
   *
   * @see [[cancelCalculateImpliedVolatility]]
   */
  calculateImpliedVolatility(
    reqId: number,
    contract: Contract,
    optionPrice: number,
    underPrice: number
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.calculateImpliedVolatility(
        reqId,
        contract,
        optionPrice,
        underPrice
      )
    );
    return this;
  }

  /**
   * Calculates an option's price based on the provided volatility and its underlying price.
   * The calculation will be emitted as tickOptionComputation event.
   *
   * @param reqId Unique identifier of the request.
   * @param contract The option's contract for which the price wants to be calculated.
   * @param volatility Hypothetical volatility.
   * @param underPrice Hypothetical underlying price.
   *
   * @see [[cancelCalculateOptionPrice]]
   */
  calculateOptionPrice(
    reqId: number,
    contract: Contract,
    volatility: number,
    underPrice: number
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.calculateOptionPrice(
        reqId,
        contract,
        volatility,
        underPrice
      )
    );
    return this;
  }

  /**
   * Cancels the account's summary request.
   * After requesting an account's summary, invoke this function to cancel it.
   *
   * @param reqId The identifier of the previously performed account request.
   *
   * @see [[reqAccountSummary]]
   */
  cancelAccountSummary(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelAccountSummary(reqId)
    );
    return this;
  }

  /**
   * Cancels account updates request for account and/or model.
   *
   * @param reqId Account subscription to cancel.
   *
   * @see [[reqAccountUpdatesMulti]]
   */
  cancelAccountUpdatesMulti(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelAccountUpdatesMulti(reqId)
    );
    return this;
  }

  /**
   * Cancels an option's implied volatility calculation request.
   *
   * @param reqId The identifier of the implied volatility's calculation request.
   *
   * @see [[calculateImpliedVolatility]]
   */
  cancelCalculateImpliedVolatility(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelCalculateImpliedVolatility(reqId)
    );
    return this;
  }

  /**
   * Cancels an option's price calculation request.
   *
   * @param reqId The identifier of the option's price's calculation request.
   *
   * @see [[calculateOptionPrice]]
   */
  cancelCalculateOptionPrice(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelCalculateOptionPrice(reqId)
    );
    return this;
  }

  /**
   * Cancels Fundamental data request.
   *
   * @param reqId The request's identifier.
   *
   * @see [[reqFundamentalData]]
   */
  cancelFundamentalData(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelFundamentalData(reqId)
    );
    return this;
  }

  /**
   * Cancels a pending [[reqHeadTimeStamp]] request.
   *
   * @param tickerId Id of the request
   *
   * @see [[reqHeadTimeStamp]]
   */
  cancelHeadTimestamp(tickerId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelHeadTimestamp(tickerId)
    );
    return this;
  }

  /**
   * Cancels a historical data request.
   *
   * @param tickerId The request's identifier.
   *
   * @see [[reqHistoricalData]]
   */
  cancelHistogramData(tickerId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelHistogramData(tickerId)
    );
    return this;
  }

  /**
   * Cancels a historical data request.
   *
   * @param tickerId The request's identifier.
   *
   * @see [[reqHistoricalData]]
   */
  cancelHistoricalData(tickerId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelHistoricalData(tickerId)
    );
    return this;
  }

  /**
   * Cancels a RT Market Data request.
   *
   * @param tickerId The request's identifier.
   *
   * @see [[reqMktData]]
   */
  cancelMktData(tickerId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelMktData(tickerId)
    );
    return this;
  }

  /**
   * Cancel a market depth's request.
   *
   * @param tickerId The request's identifier.
   * @param isSmartDepth TODO document
   *
   * @see [[reqMktDepth]]
   */
  cancelMktDepth(tickerId: number, isSmartDepth: boolean): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelMktDepth(tickerId, isSmartDepth)
    );
    return this;
  }

  /**
   * Cancels IB's news bulletin subscription.
   *
   * @see [[reqNewsBulletins]]
   */
  cancelNewsBulletins(): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelNewsBulletins()
    );
    return this;
  }

  /**
   * Cancels an active order placed by from the same API client ID.
   *
   * Note: API clients cannot cancel individual orders placed by other clients.
   * Use [[reqGlobalCancel]] instead.
   *
   * @param id The order's client id.
   *
   * @see [[placeOrder]], [[reqGlobalCancel]]
   */
  cancelOrder(orderId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelOrder(orderId)
    );
    return this;
  }

  /**
   * Cancels subscription for real time updated daily PnL.
   *
   * @param reqId The request's identifier.
   *
   * @see [[reqPnL]]
   */
  cancelPnL(reqId: number): IBApi {
    this.controller.schedule(() => this.controller.encoder.cancelPnL(reqId));
    return this;
  }

  /**
   * Cancels real time subscription for a positions daily PnL information.
   *
   * @param reqId The request's identifier.
   *
   * @see [[reqPnLSingle]]
   */
  cancelPnLSingle(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelPnLSingle(reqId)
    );
    return this;
  }

  /**
   * Cancels a previous position subscription request made with reqPositions.
   *
   * @see [[reqPositions]]
   */
  cancelPositions(): IBApi {
    this.controller.schedule(() => this.controller.encoder.cancelPositions());
    return this;
  }

  /**
   * Cancels positions request for account and/or model.
   *
   * @param reqId The identifier of the request to be canceled.
   *
   * @see [[reqPositionsMulti]]
   */
  cancelPositionsMulti(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelPositionsMulti(reqId)
    );
    return this;
  }

  /**
   * Cancels Real Time Bars' subscription.
   *
   * @param tickerId The request's identifier.
   */
  cancelRealTimeBars(tickerId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelRealTimeBars(tickerId)
    );
    return this;
  }

  /**
   * Cancels Scanner Subscription.
   *
   * @param tickerId The subscription's unique identifier.
   *
   * @see [[reqScannerSubscription]], [[reqScannerParameters]]
   */
  cancelScannerSubscription(tickerId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelScannerSubscription(tickerId)
    );
    return this;
  }

  /**
   * Cancels tick-by-tick data.
   *
   * @param tickerId Unique identifier of the request.
   *
   * @see [[reqTickByTickData]]
   */
  cancelTickByTickData(tickerId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.cancelTickByTickData(tickerId)
    );
    return this;
  }

  /**
   * Exercises an options contract.
   *
   * Note: this function is affected by a TWS setting which specifies if an exercise request must be finalized.
   *
   * @param tickerId The exercise request's identifier.
   * @param contract The option [[Contract]] to be exercised.
   * @param exerciseAction 1 to exercise the option, 2 to let the option lapse.
   * @param exerciseQuantity Number of contracts to be exercised.
   * @param account Destination account.
   * @param override Specifies whether your setting will override the system's natural action.
   * For example, if your action is "exercise" and the option is not in-the-money,
   * by natural action the option would not exercise.
   * If you have override set to "yes" the natural action would be overridden and the out-of-the money option would be exercised.
   * Set to 1 to override, set to 0 not to.
   */
  exerciseOptions(
    tickerId: number,
    contract: Contract,
    exerciseAction: OptionExerciseAction,
    exerciseQuantity: number,
    account: string,
    override: number
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.exerciseOptions(
        tickerId,
        contract,
        exerciseAction as number,
        exerciseQuantity,
        account,
        override
      )
    );
    return this;
  }

  /**
   * Places or modifies an order.
   * @param id The order's unique identifier.
   * Use a sequential id starting with the id received at the nextValidId method.
   * If a new order is placed with an order ID less than or equal to the order ID of a previous order an error will occur.
   * @param contract The order's [[Contract]].
   * @param order The [[Oder]] object.
   *
   * @see [[reqAllOpenOrders]], [[reqAutoOpenOrders]], [[reqOpenOrders]], [[cancelOrder]], [[reqGlobalCancel]]
   */
  placeOrder(id: number, contract: Contract, order: Order): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.placeOrder(id, contract, order)
    );
    return this;
  }

  /**
   * Requests all available Display Groups in TWS.
   *
   * @param reqId The ID of this request.
   */
  queryDisplayGroups(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.queryDisplayGroups(reqId)
    );
    return this;
  }

  /**
   * Replaces Financial Advisor's settings A Financial Advisor can define three different configurations:
   *
   * - Groups: offer traders a way to create a group of accounts and apply a single allocation method to all accounts in the group.
   * - Profiles: let you allocate shares on an account-by-account basis using a predefined calculation value.
   * - Account Aliases: let you easily identify the accounts by meaningful names rather than account numbers.
   * More information at https://www.interactivebrokers.com/en/?f=%2Fen%2Fsoftware%2Fpdfhighlights%2FPDF-AdvisorAllocations.php%3Fib_entity%3Dllc
   *
   * @param faDataType The configuration to change.
   * @param xml Zhe xml-formatted configuration string.
   */
  replaceFA(faDataType: FADataType, xml: string): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.replaceFA(faDataType, xml)
    );
    return this;
  }

  /**
   * Requests a specific account's summary.
   * This method will subscribe to the account summary as presented in the TWS' Account Summary tab.
   * The data is emitted as accountSummary event.
   *
   * https://www.interactivebrokers.com/en/software/tws/accountwindowtop.htm
   *
   * @param reqId The unique request identifier.
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
  reqAccountSummary(reqId: number, group: string, tags: string): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqAccountSummary(reqId, group, tags)
    );
    return this;
  }

  /**
   * Subscribes to a specific account's information and portfolio.
   * Through this method, a single account's subscription can be started/stopped.
   * As a result from the subscription, the account's information, portfolio and last update time will be emitted as
   * updateAccountValue, updateAccountPortfolio, updateAccountTime event respectively.
   *
   * All account values and positions will be returned initially, and then there will only be updates when there is a change in a position,
   * or to an account value every 3 minutes if it has changed.
   *
   * Only one account can be subscribed at a time.
   *
   * A second subscription request for another account when the previous one is still active will cause the first one to be canceled in favour of the second one.
   * Consider user reqPositions if you want to retrieve all your accounts' portfolios directly.
   *
   * @param subscribe Set to true to start the subscription and to false to stop it.
   * @param acctCode The account id (i.e. U123456) for which the information is requested.
   *
   * @see [[reqPositions]]
   */
  reqAccountUpdates(subscribe: boolean, acctCode: string): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqAccountUpdates(subscribe, acctCode)
    );
    return this;
  }

  /**
   * Requests account updates for account and/or model.
   *
   * @param reqId Identifier to label the request.
   * @param acctCode Account values can be requested for a particular account
   * @param modelCode Values can also be requested for a model
   * @param ledgerAndNLV returns light-weight request; only currency positions as opposed to account values and currency positions.
   *
   * @see [[cancelAccountUpdatesMulti]]
   */
  reqAccountUpdatesMulti(
    reqId: number,
    acctCode: string,
    modelCode: string,
    ledgerAndNLV: boolean
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqAccountUpdatesMulti(
        reqId,
        acctCode,
        modelCode,
        ledgerAndNLV
      )
    );
    return this;
  }

  /**
   * Requests all current open orders in associated accounts at the current moment.
   * The existing orders will be received via the openOrder and orderStatus events.
   *
   * Open orders are returned once; this function does not initiate a subscription.
   *
   * @see [[reqAutoOpenOrders]], [[reqOpenOrders]]
   */
  reqAllOpenOrders(): IBApi {
    this.controller.schedule(() => this.controller.encoder.reqAllOpenOrders());
    return this;
  }

  /**
   * Requests status updates about future orders placed from TWS. Can only be used with client ID 0.
   *
   * @param bAutoBind if set to `true`, the newly created orders will be assigned an API order ID and implicitly associated with this client.
   * If set to `false, future orders will not be.
   *
   * @see [[reqAllOpenOrders]], [[reqOpenOrders]], [[cancelOrder]], [[reqGlobalCancel]]
   */
  reqAutoOpenOrders(bAutoBind: boolean): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqAutoOpenOrders(bAutoBind)
    );
    return this;
  }

  /**
   * Requests completed orders.
   *
   * @param apiOnly Request only API orders.
   */
  reqCompletedOrders(apiOnly: boolean): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqCompletedOrders(apiOnly)
    );
    return this;
  }

  /**
   * Requests contract information.
   * This method will provide all the contracts matching the contract provided.
   *
   * It can also be used to retrieve complete options and futures chains.
   * Though it is now (in API version > 9.72.12) advised to use reqSecDefOptParams for that purpose.
   *
   * This information will be emitted as contractDetails event.
   *
   * @param reqId The unique request identifier.
   * @param contract The contract used as sample to query the available contracts.
   */
  reqContractDetails(reqId: number, contract: Contract): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqContractDetails(reqId, contract)
    );
    return this;
  }

  /**
   * Requests TWS's current time.
   */
  reqCurrentTime(): IBApi {
    this.controller.schedule(() => this.controller.encoder.reqCurrentTime());
    return this;
  }

  /**
   * Requests current day's (since midnight) executions matching the filter.
   * Only the current day's executions can be retrieved.
   * Along with the executions, the CommissionReport will also be returned.
   *
   * The execution details will be emitted as execDetails event.
   *
   * @param reqId The request's unique identifier.
   * @param filter The filter criteria used to determine which execution reports are returned.
   */
  reqExecutions(reqId: number, filter: ExecutionFilter): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqExecutions(reqId, filter)
    );
    return this;
  }

  /**
   * Requests family codes for an account, for instance if it is a FA, IBroker, or associated account.
   */
  reqFamilyCodes(): IBApi {
    this.controller.schedule(() => this.controller.encoder.reqFamilyCodes());
    return this;
  }

  /**
   * Requests the contract's fundamental data. Fundamental data is emitted as fundamentalData event.
   *
   * @param reqId The request's unique identifier.
   * @param contract The contract's description for which the data will be returned.
   * @param reportType there are three available report types:
   * - ReportSnapshot: Company overview.
   * - ReportsFinSummary: Financial summary.
   * - ReportRatios: Financial ratios.
   * - ReportsFinStatements: Financial statements.
   * - RESC: Analyst estimates.
   */
  reqFundamentalData(
    reqId: number,
    contract: Contract,
    reportType: string,
    fundamentalDataOptions: TagValue[] = []
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqFundamentalData(
        reqId,
        contract,
        reportType,
        fundamentalDataOptions
      )
    );
    return this;
  }

  /**
   * Cancels all active orders.
   * This method will cancel ALL open orders including those placed directly from TWS.
   *
   * @see [[cancelOrder]]
   */
  reqGlobalCancel(): IBApi {
    this.controller.schedule(() => this.controller.encoder.reqGlobalCancel());
    return this;
  }

  /**
   * Returns the timestamp of earliest available historical data for a contract and data type.
   *
   * @param reqId An identifier for the request.
   * @param contract [[Contract]] object for which head timestamp is being requested.
   * @param whatToShow Type of data for head timestamp - "BID", "ASK", "TRADES", etc
   * @param useRTH Use regular trading hours only, `true` for yes or `false` for no.
   * @param formatDate Set to 1 to obtain the bars' time as yyyyMMdd HH:mm:ss, set to 2 to obtain it like system time format in seconds.
   */
  reqHeadTimestamp(
    reqId: number,
    contract: Contract,
    whatToShow: string,
    useRTH: boolean,
    formatDate: number
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqHeadTimestamp(
        reqId,
        contract,
        whatToShow,
        useRTH,
        formatDate
      )
    );
    return this;
  }

  /**
   * Returns data histogram of specified contract.
   *
   * @param tickerId An identifier for the request.
   * @param contract [[Contract]] object for which histogram is being requested
   * @param useRTH Use regular trading hours only, `true` for yes or `false` for no.
   * @param period Period of which data is being requested, e.g. "3 days"
   */
  reqHistogramData(
    tickerId: number,
    contract: Contract,
    useRTH: boolean,
    period: string
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqHistogramData(
        tickerId,
        contract,
        useRTH,
        period
      )
    );
    return this;
  }

  /**
   * Requests contracts' historical data. When requesting historical data, a finishing time and date is required along with a duration string.
   * For example, having:
   * ````- endDateTime: 20130701 23:59:59 GMT```
   * ````- durationStr: 3 ```
   * will return three days of data counting backwards from July 1st 2013 at 23:59:59 GMT resulting in all the available bars of the last three days
   * until the date and time specified.
   *
   * It is possible to specify a timezone optionally.
   *
   * The resulting bars will be emitted as historicalData event.
   *
   * @param tickerId The request's unique identifier.
   * @param contract The contract for which we want to retrieve the data.
   * @param endDateTime Request's ending time with format yyyyMMdd HH:mm:ss {TMZ}
   * @param durationStr The amount of time for which the data needs to be retrieved:
   * - " S (seconds) - " D (days)
   * - " W (weeks) - " M (months)
   * - " Y (years)
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
   * @param keepUpToDate Set to `true` to received continuous updates on most recent bar data. If `true`, and endDateTime cannot be specified.
   */
  reqHistoricalData(
    tickerId: number,
    contract: Contract,
    endDateTime: string,
    durationStr: string,
    barSizeSetting: string,
    whatToShow: string,
    useRTH: number,
    formatDate: number,
    keepUpToDate: boolean
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqHistoricalData(
        tickerId,
        contract,
        endDateTime,
        durationStr,
        barSizeSetting,
        whatToShow,
        useRTH,
        formatDate,
        keepUpToDate
      )
    );
    return this;
  }

  /**
   * Requests historical news headlines.
   *
   * @param reqId ID of the request.
   * @param conId Contract id of ticker.
   * @param providerCodes A '+'-separated list of provider codes .
   * @param startDateTime Marks the (exclusive) start of the date range. The format is yyyy-MM-dd HH:mm:ss.0
   * @param endDateTime Marks the (inclusive) end of the date range. The format is yyyy-MM-dd HH:mm:ss.0
   * @param totalResults The maximum number of headlines to fetch (1 - 300).
   */
  reqHistoricalNews(
    reqId: number,
    conId: number,
    providerCodes: string,
    startDateTime: string,
    endDateTime: string,
    totalResults: number,
    historicalNewsOptions: TagValue[] = []
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqHistoricalNews(
        reqId,
        conId,
        providerCodes,
        startDateTime,
        endDateTime,
        totalResults,
        historicalNewsOptions
      )
    );
    return this;
  }

  /**
   * Requests historical Time&Sales data for an instrument.
   *
   * @param reqId ID of the request.
   * @param contract [[Contract]] object that is subject of query
   * @param startDateTime "20170701 12:01:00". Uses TWS timezone specified at login.
   * @param endDateTime "20170701 13:01:00". In TWS timezone. Exactly one of start time and end time has to be defined.
   * @param numberOfTicks Number of distinct data points. Max currently 1000 per request.
   * @param whatToShow 	(Bid_Ask, Midpoint, Trades) Type of data requested.
   * @param useRTH Data from regular trading hours (1), or all available hours (0)
   * @param ignoreSize A filter only used when the source price is Bid_Ask
   */
  reqHistoricalTicks(
    reqId: number,
    contract: Contract,
    startDateTime: string,
    endDateTime: string,
    numberOfTicks: number,
    whatToShow: string,
    useRTH: number,
    ignoreSize: boolean
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqHistoricalTicks(
        reqId,
        contract,
        startDateTime,
        endDateTime,
        numberOfTicks,
        whatToShow,
        useRTH,
        ignoreSize
      )
    );
    return this;
  }

  /**
   * Requests the next valid order ID at the current moment.
   *
   * @param numIds deprecated- this parameter will not affect the value returned to nextValidId
   */
  reqIds(numIds: number = 0): IBApi {
    this.controller.schedule(() => this.controller.encoder.reqIds(numIds));
    return this;
  }

  /**
   * Requests the accounts to which the logged user has access to.
   */
  reqManagedAccts(): IBApi {
    this.controller.schedule(() => this.controller.encoder.reqManagedAccts());
    return this;
  }

  /**
   * Switches data type returned from reqMktData request to "frozen", "delayed" or "delayed-frozen" market data. Requires TWS/IBG v963+.
   *
   * The API can receive frozen market data from Trader Workstation.
   * Frozen market data is the last data recorded in our system.
   * During normal trading hours, the API receives real-time market data.
   * Invoking this function with argument 2 requests a switch to frozen data immediately or after the close.
   * When the market reopens, the market data type will automatically switch back to real time if available.
   *
   * @param marketDataType By default only real-time (1) market data is enabled.
   * - 1 (real-time) disables frozen, delayed and delayed-frozen market data.
   * - 2 (frozen) enables frozen market data.
   * - 3 (delayed) enables delayed and disables delayed-frozen market data.
   * - 4 (delayed-frozen) enables delayed and delayed-frozen market data.
   */
  reqMarketDataType(marketDataType: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqMarketDataType(marketDataType)
    );
    return this;
  }

  /**
   * Requests the contract's market depth (order book).
   *
   * This request must be direct-routed to an exchange and not smart-routed.
   *
   * The number of simultaneous market depth requests allowed in an account is calculated based on a formula
   * that looks at an accounts equity, commissions, and quote booster packs.
   *
   * @param tickerId The request's identifier.
   * @param contract The [[Contract]] for which the depth is being requested.
   * @param numRows The number of rows on each side of the order book.
   * @param isSmartDepth Flag indicates that this is smart depth request.
   * @param mktDepthOptions TODO document
   *
   * @see [[cancelMktDepth]]
   */
  reqMktDepth(
    tickerId: number,
    contract: Contract,
    numRows: number,
    isSmartDepth: boolean,
    mktDepthOptions?: TagValue[]
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqMktDepth(
        tickerId,
        contract,
        numRows,
        isSmartDepth,
        mktDepthOptions
      )
    );
    return this;
  }

  /**
   * Requests details about a given market rule.
   * The market rule for an instrument on a particular exchange provides details about how the minimum price increment changes with price.
   * A list of market rule ids can be obtained by invoking reqContractDetails on a particular contract.
   * The returned market rule ID list will provide the market rule ID for the instrument in the correspond valid exchange list in contractDetails.
   *
   * @param marketRuleId The id of market rule.
   */
  reqMarketRule(marketRuleId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqMarketRule(marketRuleId)
    );
    return this;
  }

  /**
   * Requests matching stock symbols.
   *
   * Thr result will be emitted as symbolSamples event.
   *
   * @param reqId ID to specify the request
   * @param pattern Either start of ticker symbol or (for larger strings) company name.
   */
  reqMatchingSymbols(reqId: number, pattern: string): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqMatchingSymbols(reqId, pattern)
    );
    return this;
  }

  /**
   * Requests real time market data.
   * Returns market data for an instrument either in real time or 10-15 minutes delayed (depending on the market data type specified).
   *
   * @param tickerId The request's identifier.
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
   * @see [[cancelMktData]]
   */
  reqMktData(
    tickerId: number,
    contract: Contract,
    genericTickList: string,
    snapshot: boolean,
    regulatorySnapshot: boolean
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqMktData(
        tickerId,
        contract,
        genericTickList,
        snapshot,
        regulatorySnapshot
      )
    );
    return this;
  }

  /**
   * Requests venues for which market data is returned to updateMktDepthL2 (those with market makers)
   */
  reqMktDepthExchanges(): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqMktDepthExchanges()
    );
    return this;
  }

  /**
   * Requests news article body given articleId.
   *
   * @param requestId ID of the request.
   * @param providerCode Short code indicating news provider, e.g. FLY
   * @param articleId ID of the specific article.
   */
  reqNewsArticle(
    requestId: number,
    providerCode: string,
    articleId: string,
    newsArticleOptions: TagValue[] = []
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqNewsArticle(
        requestId,
        providerCode,
        articleId,
        newsArticleOptions
      )
    );
    return this;
  }

  /**
   * Subscribes to IB's News Bulletins.
   *
   * @param allMsgs If set to `true, will return all the existing bulletins for the current day.
   * If set to `false` to receive only the new bulletins.
   *
   * @see [[cancelNewsBulletin]]
   */
  reqNewsBulletins(allMsgs: boolean): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqNewsBulletins(allMsgs)
    );
    return this;
  }

  /**
   * Requests news providers which the user has subscribed to.
   */
  reqNewsProviders(): IBApi {
    this.controller.schedule(() => this.controller.encoder.reqNewsProviders());
    return this;
  }

  /**
   * Requests all open orders places by this specific API client (identified by the API client id).
   * For client ID 0, this will bind previous manual TWS orders.
   */
  reqOpenOrders(): IBApi {
    this.controller.schedule(() => this.controller.encoder.reqOpenOrders());
    return this;
  }

  /**
   * Creates subscription for real time daily PnL and unrealized PnL updates.
   *
   * @param reqId ID of the request.
   * @param account Account for which to receive PnL updates.
   * @param modelCode Specify to request PnL updates for a specific model.
   */
  reqPnL(reqId: number, account: string, modelCode?: string | null): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqPnL(reqId, account, modelCode ?? null)
    );
    return this;
  }

  /**
   * Requests real time updates for daily PnL of individual positions.
   *
   * @param reqId ID of the request.
   * @param account Account in which position exists.
   * @param modelCode Model in which position exists.
   * @param conId Contract ID (conId) of contract to receive daily PnL updates for.
   * Note: does not return message if invalid conId is entered.
   */
  reqPnLSingle(
    reqId: number,
    account: string,
    modelCode: string | null,
    conId: number
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqPnLSingle(reqId, account, modelCode, conId)
    );
    return this;
  }

  /**
   * Subscribes to position updates for all accessible accounts.
   * All positions sent initially, and then only updates as positions change.
   *
   * @see [[cancelPositions]]
   */
  reqPositions(): IBApi {
    this.controller.schedule(() => this.controller.encoder.reqPositions());
    return this;
  }

  /**
   * Requests position subscription for account and/or model.
   * Initially all positions are returned and then updates are returned for any position changes in real time.
   *
   * @param reqId Request's identifier.
   * @param account If an account Id is provided, only the account's positions belonging to the specified model will be delivered.
   * @param modelCode The code of the model's positions we are interested in.
   *
   * @see [[cancelPositionsMulti]]
   */
  reqPositionsMulti(
    reqId: number,
    account: string,
    modelCode: string | null
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqPositionsMulti(reqId, account, modelCode)
    );
    return this;
  }

  /**
   * Requests real time bars.
   *
   * Currently, only 5 seconds bars are provided.
   *
   * This request is subject to the same pacing as any historical data request: no more than 60 API queries in more than 600 seconds.
   * Real time bars subscriptions are also included in the calculation of the number of Level 1 market data subscriptions allowed in an account.
   *
   * @param tickerId The request's unique identifier.
   * @param contract The [[Contract]] for which the depth is being requested
   * @param barSize currently being ignored
   * @param whatToShow the nature of the data being retrieved:
   * - TRADES
   * - MIDPOINT
   * - BID
   * - ASK
   * @param useRTH Set to `false` to obtain the data which was also generated ourside of the Regular Trading Hours.
   * Set to `true` to obtain only the RTH data
   *
   * @see [[cancelRealTimeBars]]
   */
  reqRealTimeBars(
    tickerId: number,
    contract: Contract,
    barSize: number,
    whatToShow: string,
    useRTH: boolean,
    realTimeBarsOptions: TagValue[] = []
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqRealTimeBars(
        tickerId,
        contract,
        barSize,
        whatToShow,
        useRTH,
        realTimeBarsOptions
      )
    );
    return this;
  }

  /**
   * Requests an XML list of scanner parameters valid in TWS.
   *
   * Not all parameters are valid from API scanner.
   *
   * @sse [[reqScannerSubscription]]
   */
  reqScannerParameters(): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqScannerParameters()
    );
    return this;
  }

  /**
   * Starts a subscription to market scan results based on the provided parameters.
   *
   * @param tickerId The request's identifier.
   * @param subscription Summary of the scanner subscription including its filters.
   * @param scannerSubscriptionOptions TODO document
   * @param scannerSubscriptionFilterOptions TODO document
   *
   * @see [[reqScannerParameters]]
   */
  reqScannerSubscription(
    tickerId: number,
    subscription: ScannerSubscription,
    scannerSubscriptionOptions: TagValue[] = [],
    scannerSubscriptionFilterOptions: TagValue[] = []
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqScannerSubscription(
        tickerId,
        subscription,
        scannerSubscriptionOptions,
        scannerSubscriptionFilterOptions
      )
    );
    return this;
  }

  /**
   * Requests security definition option parameters for viewing a contract's option chain.
   *
   * @param reqId The request's identifier.
   * @param underlyingSymbol Underlying symbol name.
   * @param futFopExchange The exchange on which the returned options are trading.
   * Can be set to the empty string "" for all exchanges.
   * @param underlyingSecType The type of the underlying security, i.e. STK
   * @param underlyingConId the contract ID of the underlying security
   */
  reqSecDefOptParams(
    reqId: number,
    underlyingSymbol: string,
    futFopExchange: string,
    underlyingSecType: string,
    underlyingConId: number
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqSecDefOptParams(
        reqId,
        underlyingSymbol,
        futFopExchange,
        underlyingSecType,
        underlyingConId
      )
    );
    return this;
  }

  /**
   * Returns the mapping of single letter codes to exchange names given the mapping identifier.
   *
   * @param reqId The id of the request.
   * @param bboExchange The mapping identifier received from on tickReqParams event.
   */
  reqSmartComponents(reqId: number, bboExchange: string): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqSmartComponents(reqId, bboExchange)
    );
    return this;
  }

  /**
   * Requests pre-defined Soft Dollar Tiers.
   *
   * This is only supported for registered professional advisors and hedge and mutual funds who have configured Soft Dollar Tiers in Account Management.
   *
   * Refer to: https://www.interactivebrokers.com/en/software/am/am/manageaccount/requestsoftdollars.htm?Highlight=soft%20dollar%20tier.
   *
   * @param reqId The id of the request.
   */
  reqSoftDollarTiers(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqSoftDollarTiers(reqId)
    );
    return this;
  }

  /**
   * Requests tick-by-tick data.
   *
   * @param reqId Unique identifier of the request.
   * @param contract The [[Contract]] for which tick-by-tick data is requested.
   * @param tickType tick-by-tick data type: "Last", "AllLast", "BidAsk" or "MidPoint".
   * @param numberOfTicks number of ticks.
   * @param ignoreSize ignore size flag.
   */
  reqTickByTickData(
    reqId: number,
    contract: Contract,
    tickType: TickByTickDataType,
    numberOfTicks: number,
    ignoreSize: boolean
  ): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.reqTickByTickData(
        reqId,
        contract,
        tickType,
        numberOfTicks,
        ignoreSize
      )
    );
    return this;
  }

  /**
   * Requests the FA configuration A Financial Advisor can define three different configurations:
   *
   * - 1. Groups: offer traders a way to create a group of accounts and apply a single allocation method to all accounts in the group.
   * - 2. Profiles: let you allocate shares on an account-by-account basis using a predefined calculation value.
   * - 3. Account Aliases: let you easily identify the accounts by meaningful names rather than account numbers.
   *
   * More information at https://www.interactivebrokers.com/en/?f=%2Fen%2Fsoftware%2Fpdfhighlights%2FPDF-AdvisorAllocations.php%3Fib_entity%3Dllc
   *
   * @param faDataType The configuration to change. Set to 1, 2 or 3 as defined above.
   */
  requestFA(faDataType: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.requestFA(faDataType)
    );
    return this;
  }

  /**
   * Integrates API client and TWS window grouping.
   *
   * @param reqId The Id chosen for this subscription request.
   * @param groupId The display group for integration.
   */
  subscribeToGroupEvents(reqId: number, groupId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.subscribeToGroupEvents(reqId, groupId)
    );
    return this;
  }

  /**
   * Updates the contract displayed in a TWS Window Group.
   *
   * @param reqId The ID chosen for this request.
   * @param contractInfo An encoded value designating a unique IB contract.
   * Possible values include:
   * - none = empty selection
   * - contractID = any non-combination contract. Examples 8314 for IBM SMART; 8314 for IBM ARCA
   * - combo = if any combo is selected Note: This request from the API does not get a TWS response unless an error occurs.
   */
  updateDisplayGroup(reqId: number, contractInfo: string): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.updateDisplayGroup(reqId, contractInfo)
    );
    return this;
  }

  /**
   * Cancels a TWS Window Group subscription.
   *
   * @param reqId The request ID.
   *
   * @sse [[subscribeToGroupEvents]]
   */
  unsubscribeFromGroupEvents(reqId: number): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.unsubscribeToGroupEvents(reqId)
    );
    return this;
  }

  /**
   * Changes the TWS/GW log level.
   *
   * The default is [[LOG_LEVEL.ERROR]]
   *
   * @param logLevel The log level.
   */
  setServerLogLevel(logLevel: LogLevel): IBApi {
    this.controller.schedule(() =>
      this.controller.encoder.setServerLogLevel(logLevel)
    );
    return this;
  }
}

// Event emitter interface
export declare interface IBApi {
  /**
   * Notifies when an event has been received (called for the any type for event).
   *
   * @param listener
   * event: Name of the event.
   *
   * arguments: event arguments.
   */
  on(
    event: EventName.all,
    listener: (event: string, arguments: string[]) => void
  ): this;

  /**
   * Notifies when the connection to TWS/IB Gateway has been established successfully.
   *
   * @param listener Notification callback.
   *
   * @see [[connect]]
   */
  on(event: EventName.connected, listener: () => void): this;

  /**
   * Notifies that the TCP socket connection to the TWS/IB Gateway has been disconnected.
   *
   * @param listener Notification callback.
   *
   * @see [[disconnect]]
   */
  on(event: EventName.disconnected, listener: () => void): this;

  /**
   * Provides status information messages for development / logging purpose.
   *
   * message: Message text.
   */
  on(event: EventName.info, listener: (message: string) => void): this;

  /**
   * Notifies about an error and TCP socket connection to the TWS/IB Gateway.
   *
   * `disconnected` event will arrive soon afterwards.
   *
   * @param listener
   * error: The error details.
   *
   * code: The code identifying the error.
   *
   * reqId: The request identifier which generated the error.
   */
  on(
    event: EventName.error,
    listener: (error: Error, code: ErrorCode, reqId: number) => void
  ): this;

  /**
   * Notifies about the API server version.
   *
   * Will arrive soon after `connected` event.
   *
   * @param listener
   * serverVersion: The server version.

   * serverConnectionTime: The connection time.
   *
   * @see [[connect]]
   */
  on(
    event: EventName.server,
    listener: (serverVersion: number, serverConnectionTime: string) => void
  ): this;

  /**
   * Notifies when data has been received from the server.
   *
   * @param listener
   * tokens: Array of received tokens.
   */
  on(event: EventName.received, listener: (tokens: string[]) => void): this;

  /**
   * Notifies when data is sent to the server.
   *
   * @param listener
   * tokens: Array of token to be sent.
   */
  on(event: EventName.sent, listener: (tokens: string[]) => void): this;

  /**
   * Notifies about the the result to request.
   *
   * @param listener
   * event: Name of the event.
   *
   * arguments: event arguments.
   */
  on(
    event: EventName.result,
    listener: (event: string, arguments: string[]) => void
  ): this;

  /**
   * Notifies when all the account's information has finished.
   *
   * @param listener
   * account: The account's id
   *
   * @see [[reqAccountUpdates]]
   */
  on(
    event: EventName.accountDownloadEnd,
    listener: (account: string) => void
  ): this;

  /**
   * Receives the account information.
   * This method will receive the account information just as it appears in the TWS' Account Summary Window.
   *
   * @param listener
   * reqID: The request's unique identifier.
   *
   * account:	The account id.
   *
   * tag: The account's attribute being received. Possible values:
   * - AccountType:Identifies the IB account structure.
   * - NetLiquidation: The basis for determining the price of the assets in your account. Total cash value + stock value + options value + bond value.
   * - TotalCashValue: Total cash balance recognized at the time of trade + futures PNL.
   * - SettledCash: Cash recognized at the time of settlement - purchases at the time of trade - commissions - taxes - fees.
   * - AccruedCash: Total accrued cash value of stock, commodities and securities.
   * - BuyingPower: Buying power serves as a measurement of the dollar value of securities that one may purchase in a securities account without depositing additional funds.
   * - EquityWithLoanValue: Forms the basis for determining whether a client has the necessary assets to either initiate or maintain security positions. Cash + stocks + bonds + mutual funds
   * - PreviousEquityWithLoanValue:  Marginable Equity with Loan value as of 16:00 ET the previous day
   * - GrossPositionValue: The sum of the absolute value of all stock and equity option positions
   * - RegTEquity:Regulation T equity for universal account
   * - RegTMargin. Regulation T margin for universal account
   * - SMA: Special Memorandum Account: Line of credit created when the market value of securities in a Regulation T account increase in value
   * - InitMarginReq: Initial Margin requirement of whole portfolio
   * - MaintMarginReq: Maintenance Margin requirement of whole portfolio
   * - AvailableFunds: This value tells what you have available for trading
   * - ExcessLiquidity: This value shows your margin cushion, before liquidation
   * - Cushion: Excess liquidity as a percentage of net liquidation value
   * - FullInitMarginReq: Initial Margin of whole portfolio with no discounts or intraday credits
   * - FullMaintMarginReq: Maintenance Margin of whole portfolio with no discounts or intraday credits
   * - FullAvailableFunds: Available funds of whole portfolio with no discounts or intraday credits
   * - FullExcessLiquidity: Excess liquidity of whole portfolio with no discounts or intraday credits
   * - LookAheadNextChange: Time when look-ahead values take effect
   * - LookAheadInitMarginReq: Initial Margin requirement of whole portfolio as of next period's margin change
   * - LookAheadMaintMarginReq: Maintenance Margin requirement of whole portfolio as of next period's margin change
   * - LookAheadAvailableFunds: This value reflects your available funds at the next margin change
   * - LookAheadExcessLiquidity: This value reflects your excess liquidity at the next margin change
   * - HighestSeverity: A measure of how close the account is to liquidation
   * - DayTradesRemaining: The Number of Open/Close trades a user could put on before Pattern Day Trading is detected. A value of "-1" means that the user can put on unlimited day trades.
   * - Leverage: GrossPositionValue / NetLiquidation
   *
   * value: the account's attribute's value.
   *
   * @see [[reqAccountSummary]]
   */
  on(
    event: EventName.accountSummary,
    listener: (
      reqId: number,
      account: string,
      tag: string,
      value: string,
      currency: string
    ) => void
  ): this;

  /**
   * Notifies when all the accounts' information has ben received.
   *
   * Requires TWS 967+ to receive accountSummaryEnd in linked account structures.
   *
   * @param listener
   * reqID: The request's unique identifier.
   *
   * @see [[reqAccountSummary]]
   */
  on(
    event: EventName.accountSummaryEnd,
    listener: (reqId: number) => void
  ): this;

  /**
   * Provides the account updates.
   *
   * @param listener
   * requestId:	The id of request.
   *
   * account: The account with updates.
   *
   * modelCode: The model code with updates.
   *
   * key: The name of parameter.
   *
   * value: The value of parameter.
   *
   * currency: The currency of parameter.
   *
   * @see [[reqAccountUpdatesMulti]]
   */
  on(
    event: EventName.accountUpdateMulti,
    listener: (
      reqId: number,
      account: string,
      modelCode: string,
      key: string,
      value: string,
      currency: string
    ) => void
  ): this;

  /**
   * Indicates all the account updates have been transmitted.
   *
   * @param listener
   * requestId:	The id of request.
   *
   * @see [[reqAccountUpdatesMulti]]
   */
  on(
    event: EventName.accountUpdateMultiEnd,
    listener: (reqId: number) => void
  ): this;

  /**
   * Delivers the Bond contract data after this has been requested via reqContractDetails.
   *
   * @param listener
   * reqId:	The request's identifier.
   *
   * contract: The bond contract's information.
   *
   * @see [[reqAccountUpdatesMulti]]
   */
  on(
    event: EventName.bondContractDetails,
    listener: (reqId: number, contract: Contract) => void
  ): this;

  /**
   * Provides the [[CommissionReport]] of an [[Execution]]
   *
   * @param listener
   * commissionReport: The commission report.
   *
   * @see [[reqExecutions]]
   */
  on(
    event: EventName.commissionReport,
    listener: (commissionReport: CommissionReport) => void
  ): this;

  /**
   * Feeds in completed orders.
   *
   * @param listener
   * contract: The order's [[Contract]].
   *
   * order: The completed [[Order]].
   *
   * orderState: The order's [[OrderState]].
   *
   * @see [[reqCompletedOrders]]
   */
  on(
    event: EventName.completedOrder,
    listener: (contract: Contract, order: Order, orderState: OrderState) => void
  ): this;

  /**
   * Notifies the end of the completed orders' reception.
   *
   * @param listener Completion callback function.
   *
   * @see [[reqCompletedOrders]]
   */
  on(event: EventName.completedOrdersEnd, listener: () => void): this;

  /**
   * Callback to indicate the API connection has closed.
   * Following a API <-> TWS broken socket connection, this function is not called automatically but must be triggered by API client code.
   *
   * @param listener Connection closed callback function.
   *
   * @see [[disconnect]]
   */
  on(event: EventName.connectionClosed, listener: () => void): this;

  /**
   * Receives the full contract's definitions.
   * This method will return all contracts matching the requested via [[reqContractDetails]]
   * For example, one can obtain the whole option chain with it.
   *
   * @param listener
   * reqId: The unique request identifier.
   *
   * contractDetails: The instrument's complete definition.
   *
   * @see [[reqContractDetails]]
   */
  on(
    event: EventName.contractDetails,
    listener: (reqId: number, contractDetails: ContractDetails) => void
  ): this;

  /**
   * After all contracts matching the request were returned, this method will mark the end of their reception.
   *
   * @param listener
   * reqId: the request's identifier
   *
   * @see [[reqContractDetails]]
   */
  on(
    event: EventName.contractDetailsEnd,
    listener: (reqId: number) => void
  ): this;

  /**
   * TWS's current time.
   *
   * TWS is synchronized with the server (not local computer) using NTP and this function
   * will receive the current time in TWS.
   *
   * @param listener
   * time: The current time in TWS.
   *
   * @see [[reqCurrentTime]]
   */
  on(event: EventName.currentTime, listener: (time: number) => void): this;

  /**
   * Upon accepting a Delta-Neutral DN RFQ(request for quote), the server sends a `deltaNeutralValidation` message
   * with the [[DeltaNeutralContract]]structure.
   * If the delta and price fields are empty in the original request, the confirmation will contain the current
   * values from the server. These values are locked when RFQ is processed and remain locked until the RFQ is cancelled.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * deltaNeutralContract	Delta-Neutral [[Contract]].
   */
  on(
    event: EventName.deltaNeutralValidation,
    listener: (
      reqId: number,
      deltaNeutralContract: DeltaNeutralContract
    ) => void
  ): this;

  /**
   * When requesting market data snapshots, this market will indicate the snapshot reception is finished.
   *
   * Expected to occur 11 seconds after beginning of request.
   *
   * @param listener
   * reqId: The request's identifier.
   */
  on(event: EventName.tickSnapshotEnd, listener: (reqId: number) => void): this;

  /**
   * Returns the market data type (real-time, frozen, delayed, delayed-frozen) of ticker sent by [[reqMktData]]
   * when TWS switches from real-time to frozen and back and from delayed to delayed-frozen and back.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * marketDataType:
   * Signals that now API starts to tick with the following market data:
   * - 1: real-time
   * - 2: frozen
   * - 3: delayed
   * - 4: delayed-frozen
   */
  on(
    event: EventName.marketDataType,
    listener: (reqId: number, marketDataType: number) => void
  ): this;

  /**
   * A one-time response to querying the display groups.
   *
   * @param listener
   * reqId: The ID of the request.
   *
   * groups: A list of integers representing visible Group ID separated by the "|" character, and sorted by most used group first.
   *
   * @see [[queryDisplayGroups]]
   */
  on(
    event: EventName.displayGroupList,
    listener: (reqId: number, groups: string) => void
  ): this;

  /**
   * Call triggered once after receiving the subscription request, and will be sent again
   * if the selected contract in the subscribed display group has changed.
   *
   * @param listener
   * reqId: The ID of the request.
   *
   * contractInfo: The contract information.
   *
   * @see [[subscribeToGroupEvents]]
   */
  on(
    event: EventName.displayGroupUpdated,
    listener: (reqId: number, contractInfo: string) => void
  ): this;

  /**
   * Handles errors generated within the API itself.
   *
   * If an exception is thrown within the API code it will be notified here.
   * Possible cases include errors while reading the information from the socket or even mishandling at API implementation.
   *
   * @param listener
   * error: The thrown exception.
   */
  on(event: EventName.error, listener: (error: Error) => void): this;

  /**
   * Errors sent by the TWS are received here.
   *
   * If an exception is thrown within the API code it will be notified here.
   * Possible cases include errors while reading the information from the socket or even mishandling at API implementation.
   *
   * @param listener
   * id: The request identifier which generated the error. Note: -1 will indicate a notification and not true error condition.
   *
   * errorCode: The code identifying the error.
   *
   * errorMsg: Error's description. Currently Latin-1 encoded error messages are supported.
   * If logged into TWS in a different language it is recommended to enabled the setting in
   * TWS Global Configuration -> API -> Settings -> Show API errors in English.
   */
  on(
    event: EventName.error,
    listener: (id: number, errorCode: number, errorMsg: string) => void
  ): this;

  /**
   * Provides the executions which happened in the last 24 hours.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * contract: The [[Contract]] of the [[Order]].
   *
   * execution: The [[Execution]] details.
   *
   * @see [[reqExecutions]]
   */
  on(
    event: EventName.execDetails,
    listener: (reqId: number, contract: Contract, execution: Execution) => void
  ): this;

  /**
   * Indicates the end of the [[Execution]] reception.
   *
   * @param listener
   * reqId The request's identifier.
   *
   * @see [[reqExecutions]]
   */
  on(event: EventName.execDetailsEnd, listener: (reqId: number) => void): this;

  /**
   * Returns array of family codes.
   *
   * @param listener
   * familyCodes Array of family codes.
   *
   * @see [[reqFamilyCodes]]
   */
  on(
    event: EventName.familyCodes,
    listener: (familyCodes: FamilyCode[]) => void
  ): this;

  /**
   * Returns array of sample contract descriptions.
   *
   * @param listener
   * familyCodes Array of family codes.
   *
   * @see [[reqFamilyCodes]]
   */
  on(
    event: EventName.contractDescriptions,
    listener: (
      reqId: number,
      contractDescriptions: ContractDescription[]
    ) => void
  ): this;

  /**
   * Returns fundamental data.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * data: xml-formatted fundamental data.
   *
   * @see [[reqFundamentalData]]
   */
  on(
    event: EventName.fundamentalData,
    listener: (reqId: number, data: string) => void
  ): this;

  /**
   * Returns beginning of data for contract for specified data type.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * headTimestamp: string identifying earliest data.
   *
   * @see [[reqHeadTimestamp]]
   */
  on(
    event: EventName.headTimestamp,
    listener: (reqId: number, headTimestamp: string) => void
  ): this;

  /**
   * Returns data histogram.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * data: Tuple of histogram data, number of trades at specified price level.
   *
   * @see [[reqHistogramData]]
   */
  on(
    event: EventName.histogramData,
    listener: (reqId: number, data: HistogramEntry[]) => void
  ): this;

  /**
   * Returns the requested historical data bars.
   *
   * @param listener
   * reqId:	the request's identifier
   *
   * time: the time the bar represents
   * open: price at open of time period
   * high: high price during time period
   * low: low price during time period
   * close: price at close of time period
   * volume: share volume during time period
   * count: trade count during time period
   * WAP: weighted average price
   * hasGaps: identifies whether or not there are gaps in the data.
   * The time zone of the bar is the time zone chosen on the TWS login screen.
   * Smallest bar size is 1 second.
   *
   * @see https://interactivebrokers.github.io/tws-api/historical_bars.html#hd_what_to_show
   * for additional context regarding meaning of price for different bar types
   */
  on(
    event: EventName.historicalData,
    listener: (
      reqId: number,
      time: string,
      open: number,
      high: number,
      low: number,
      close: number,
      volume: number,
      count: number,
      WAP: number,
      hasGaps: boolean | undefined
    ) => void
  ): this;

  /**
   * Receives bars in real time if keepUpToDate is `true` in reqHistoricalData.
   * Similar to realTimeBars function, except returned data is a composite of historical data and
   * real time data that is equivalent to TWS chart functionality to keep charts up to date.
   *
   * Returned bars are successfully updated using real time data.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * time: the time the bar represents
   * open: price at open of time period
   * high: high price during time period
   * low: low price during time period
   * close: price at close of time period
   * volume: share volume during time period
   * count: trade count during time period
   * WAP: weighted average price
   * The time zone of the bar is the time zone chosen on the TWS login screen.
   * Smallest bar size is 1 second.
   *
   * @see [[reqHistogramData]]
   */
  on(
    event: EventName.historicalDataUpdate,
    listener: (
      reqId: number,
      time: string,
      open: number,
      high: number,
      low: number,
      close: number,
      volume: number,
      count: number,
      WAP: number
    ) => void
  ): this;

  on(
    event: EventName.historicalNews,
    listener: (
      reqId: number,
      time: string,
      providerCode: string,
      articleId: string,
      headline: string
    ) => void
  ): this;

  /**
   * Returns news headline.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * hasMore: `true` if there are more results available, `false` otherwise
   *
   * @see [[reqHistoricalNews]]
   */
  on(
    event: EventName.historicalNewsEnd,
    listener: (reqId: number, hasMore: boolean) => void
  ): this;

  /**
   * Returns historical price tick data.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * ticks: Array of [[HistoricalTick]] objects.
   *
   * done: Flag to indicate if all historical tick data has been received.
   *
   * @see [[reqHistoricalTicks]]
   */
  on(
    event: EventName.historicalTicks,
    listener: (reqId: number, ticks: HistoricalTick[], done: boolean) => void
  ): this;

  /**
   * Returns historical bid/ask tick data.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * ticks: Array of [[HistoricalTickBidAsk]] objects.
   *
   * done: Flag to indicate if all historical tick data has been received.
   *
   * @see [[reqHistoricalTicks]]
   */
  on(
    event: EventName.historicalTicksBidAsk,
    listener: (
      reqId: number,
      ticks: HistoricalTickBidAsk[],
      done: boolean
    ) => void
  ): this;

  /**
   * Returns historical last price tick data.
   *
   * @param listener
   * reqId: The request's identifier.
   *
   * ticks: Array of [[HistoricalTickLas]] objects.
   *
   * done: Flag to indicate if all historical tick data has been received.
   *
   * @see [[reqHistoricalTicks]]
   */
  on(
    event: EventName.historicalTicksLast,
    listener: (
      reqId: number,
      ticks: HistoricalTickLast[],
      done: boolean
    ) => void
  ): this;

  /**
   * Receives a comma-separated string with the managed account ids.
   * Occurs automatically on initial API client connection.
   *
   * @param listener
   * accountsList: A comma-separated string with the managed account ids.
   *
   * @see [[reqManagedAccts]]
   */
  on(
    event: EventName.managedAccounts,
    listener: (accountsList: string) => void
  ): this;

  /**
   * Returns minimum price increment structure for a particular market rule ID.
   * Market rule IDs for an instrument on valid exchanges can be obtained from the contractDetails object for that contract.
   *
   * @param listener
   * marketRuleId: The Market rule IDs.
   *
   * priceIncrements: Array of price increments.
   *
   * @see [[reqMarketRule]]
   */
  on(
    event: EventName.marketRule,
    listener: (
      marketRuleId: number,
      priceIncrements: unknown[] /* TODO: replace with PriceIncrement type as soon as available. */
    ) => void
  ): this;

  /**
   * Called when receives Depth Market Data Descriptions.
   *
   * @param listener
   * depthMktDataDescriptions: Array of [[DepthMktDataDescription]] objects.
   *
   * @see [[reqMktDepthExchanges]]
   */
  on(
    event: EventName.mktDepthExchanges,
    listener: (depthMktDataDescriptions: DepthMktDataDescription[]) => void
  ): this;

  /**
   * Called when receives News Article.
   *
   * @param listener
   * reqId:	The request ID.
   *
   * articleType: The type of news article (0 - plain text or html, 1 - binary data / pdf)
   *
   * articleText:	The body of article (if articleType == 1, the binary data is encoded using the Base64 scheme)
   *
   * @see [[reqNewsArticle]]
   */
  on(
    event: EventName.newsArticle,
    listener: (reqId: number, articleType: number, articleText: string) => void
  ): this;

  /**
   * Returns array of subscribed API news providers for this user
   *
   * @param listener
   * newsProviders:	Array of [NewsProvider]] objects.
   *
   * @see [[reqNewsProviders]]
   */
  on(
    event: EventName.newsProviders,
    listener: (newsProviders: NewsProvider[]) => void
  ): this;

  /**
   * Receives next valid order id.
   * Will be invoked automatically upon successful API client connection, or after call to [[reqIds]].
   *
   * Important: the next valid order ID is only valid at the time it is received.
   *
   * @param listener
   * orderId: The next order id.
   *
   * @see [[reqIds]]
   */
  on(event: EventName.nextValidId, listener: (orderId: number) => void): this;

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
  on(
    event: EventName.openOrder,
    listener: (
      orderId: number,
      contract: Contract,
      order: Order,
      orderState: OrderState
    ) => void
  ): this;

  /**
   * Notifies the end of the open orders' reception.
   *
   * @param listener Completion callback.
   *
   * @see [[placeOrder]], [[reqAllOpenOrders]], [[reqAutoOpenOrders]]
   */
  on(event: EventName.openOrderEnd, listener: () => void): this;

  /**
   * Response to API bind order control message.
   *
   * @param listener Completion callback.
   * orderId: permId
   *
   * apiClientId: API client id.
   *
   * apiOrderId: API order id.
   *
   * @see [[reqOpenOrders]]
   */
  on(
    event: EventName.orderBound,
    listener: (orderId: number, apiClientId: number, apiOrderId: number) => void
  ): this;

  /**
   * Gives the up-to-date information of an order every time it changes.
   * Often there are duplicate orderStatus messages.
   *
   * @param listener Completion callback.
   * orderId: The order's client id.
   *
   * status: The current status of the order.
   * Possible values:
   * - PendingSubmit: indicates that you have transmitted the order, but have not yet received confirmation that it has been accepted by the order destination.
   * - PendingCancel: indicates that you have sent a request to cancel the order but have not yet received cancel confirmation from the order destination.
   * At this point, your order is not confirmed canceled. It is not guaranteed that the cancellation will be successful.
   * - PreSubmitted: indicates that a simulated order type has been accepted by the IB system and that this order has yet to be elected.
   * The order is held in the IB system until the election criteria are met. At that time the order is transmitted to the order destination as specified.
   * - Submitted: indicates that your order has been accepted by the system.
   * - ApiCancelled: after an order has been submitted and before it has been acknowledged, an API client client can request its cancellation,
   * producing this state.
   * - Cancelled: indicates that the balance of your order has been confirmed canceled by the IB system.
   * This could occur unexpectedly when IB or the destination has rejected your order.
   * - Filled: indicates that the order has been completely filled. Market orders executions will not always trigger a Filled status.
   * - Inactive: indicates that the order was received by the system but is no longer active because it was rejected or canceled.
   *
   * filled: Number of filled positions.
   *
   * remaining: The remnant positions.
   *
   * avgFillPrice: Average filling price.
   *
   * permId	the order's permId used by the TWS to identify orders.
   *
   * parentId: parent's id. Used for bracket and auto trailing stop orders.
   *
   * lastFillPrice: Price at which the last positions were filled.
   *
   * clientId:	API client which submitted the order.
   *
   * whyHeld:	this field is used to identify an order held when TWS is trying to locate shares for a short sell.
   * The value used to indicate this is 'locate'.
   *
   * mktCapPrice: If an order has been capped, this indicates the current capped price.
   * Requires TWS 967+ and API v973.04+.
   *
   * @see [[placeOrder]], [[reqAllOpenOrders]], [[reqAutoOpenOrders]]
   */
  on(
    event: EventName.orderStatus,
    listener: (
      orderId: number,
      status: string,
      filled: number,
      remaining: number,
      avgFillPrice: number,
      permId: number,
      parentId: number,
      lastFillPrice: number,
      clientId: number,
      whyHeld: string,
      mktCapPrice: number
    ) => void
  ): this;

  /**
   * Receives PnL updates in real time for the daily PnL and the total unrealized PnL for an account.
   *
   * @param listener
   * reqId:	The request ID.
   *
   * dailyPnL: The dailyPnL updates for the account in real time.
   *
   * unrealizedPnL:	The total unrealized PnL updates for the account in real time.
   *
   * unrealizedPnL:	The total realized PnL updates for the account in real time.
   *
   * @see [[reqPnL]]
   */
  on(
    event: EventName.pnl,
    listener: (
      reqId: number,
      dailyPnL: number,
      unrealizedPnL: number,
      realizedPnL: number
    ) => void
  ): this;

  /**
   * Receives real time updates for single position daily PnL values.
   *
   * @param listener
   * reqId:	The request ID.
   *
   * pos: Current size of the position
   *
   * dailyPnL: The daily PnL for the position
   *
   * unrealizedPnL:	The total unrealized PnL for the position (since inception) updating in real time.
   *
   * value: The current market value of the position.
   *
   * @see [[reqSinglePnL]]
   */
  on(
    event: EventName.pnlSingle,
    listener: (
      reqId: number,
      pos: number,
      dailyPnL: number,
      unrealizedPnL: number,
      realizedPnL: number,
      value: number
    ) => void
  ): this;

  /**
   * Provides the portfolio's open positions.
   *
   * @param listener
   * account: The account holding the position.
   *
   * contract: The position's [[Contract]]
   *
   * pos: The number of positions held.
   *
   * avgCost: The average cost of the position.
   *
   * @see [[reqPositions]]
   */
  on(
    event: EventName.position,
    listener: (
      account: string,
      contract: Contract,
      pos: number,
      avgCost: number
    ) => void
  ): this;

  /**
   * Indicates all the positions have been transmitted.
   *
   * @param listener Completion callback.
   *
   * @see [[reqPnL]]
   */
  on(event: EventName.positionEnd, listener: () => void): this;

  /**
   * Provides the portfolio's open positions.
   *
   * @param listener
   * reqId:	The request ID.
   *
   * account: The account holding the position.
   *
   * modelCode: The model code holding the position.
   *
   * contract: The position's [[Contract]]
   *
   * pos: The number of positions held.
   *
   * avgCost: The average cost of the position.
   *
   * @see [[reqPositionsMulti]]
   */
  on(
    event: EventName.positionMulti,
    listener: (
      reqId: number,
      account: string,
      modelCode: string,
      contract: Contract,
      pos: number,
      avgCost: number
    ) => void
  ): this;

  /**
   * Indicates all the positions have been transmitted.
   *
   * @param listener
   * reqId:	The request ID.
   *
   * @see [[reqPositionsMulti]]
   */
  on(
    event: EventName.positionMultiEnd,
    listener: (reqId: number) => void
  ): this;

  /**
   * Updates the real time 5 seconds bars.
   *
   * @param listener
   * reqId:	The request ID.
   * date: The bar's date and time (Epoch/Unix time).
   * open: The bar's open point.
   * high: The bar's high point.
   * low: The bar's low point.
   * close: The bar's closing point.
   * volume: The bar's traded volume (only returned for TRADES data).
   * WAP:	the bar's Weighted Average Price rounded to minimum increment (only available for TRADES).
   * count: the number of trades during the bar's timespan (only available for TRADES).
   *
   * @see [[reqRealTimeBars]]
   */
  on(
    event: EventName.realtimeBar,
    listener: (
      reqId: number,
      date: number,
      open: number,
      high: number,
      low: number,
      close: number,
      volume: number,
      WAP: number,
      count: number
    ) => void
  ): this;

  /**
   * Receives the Financial Advisor's configuration available in the TWS.
   *
   * @param listener
   * faDataType: one of:
   * - 1: Groups: offer traders a way to create a group of accounts and apply a single allocation method to all accounts in the group.
   * - 2: Profiles: let you allocate shares on an account-by-account basis using a predefined calculation value.
   * - 3: Account Aliases: let you easily identify the accounts by meaningful names rather than account numbers.
   *
   * faXmlData: The xml-formatted configuration.
   *
   * @see [[requestFA]], [[replaceFA]]
   */
  on(
    event: EventName.receiveFA,
    listener: (faDataType: number, faXmlData: string) => void
  ): this;

  /**
   * Notifies the end of the FA replace.
   *
   * @param listener
   * reqId: The id of request.
   *
   * text: The message text.
   *
   * @see [[requestFA]], [[replaceFA]]
   */
  on(
    event: EventName.replaceFAEnd,
    listener: (reqId: number, text: string) => void
  ): this;

  /**
   * Returns conId and exchange for CFD market data request re-route.
   *
   * @param listener
   * reqId: The id of request.
   *
   * conId: Contract Id of the underlying instrument which has market data.
   *
   * exchange: Exchange code of the underlying.
   */
  on(
    event: EventName.rerouteMktDataReq,
    listener: (reqId: number, conId: number, exchange: string) => void
  ): this;

  /**
   * Returns the conId and exchange for an underlying contract when a request is made for level 2 data for an
   * instrument which does not have data in IB's database. For example stock CFDs and index CFDs.
   *
   * @param listener
   * reqId: The id of request.
   *
   * conId: Contract Id of the underlying instrument which has market data.
   *
   * exchange: Exchange code of the underlying.
   */
  on(
    event: EventName.rerouteMktDepthReq,
    listener: (reqId: number, conId: number, exchange: string) => void
  ): this;

  /**
   * Provides the data resulting from the market scanner request.
   *
   * @param listener
   * reqId: The id of request.
   *
   * rank: The ranking within the response of this bar.
   *
   * contractDetails: The data [[ContractDetails].
   *
   * distance: variable, according to query.
   *
   * benchmark: variable, according to query.
   *
   * projection: variable, according to query.
   *
   * legStr: Describes the combo legs when the scanner is returning EFP.
   *
   * @see [[reqScannerSubscription]]
   */
  on(
    event: EventName.scannerData,
    listener: (
      reqId: number,
      rank: number,
      contractDetails: ContractDetails,
      distance: string,
      benchmark: string,
      projection: string,
      legsStr: string
    ) => void
  ): this;

  /**
   * Indicates the scanner data reception has terminated.
   *
   * @param listener
   * reqId: The id of request.
   *
   * @see [[reqScannerSubscription]]
   */
  on(event: EventName.scannerDataEnd, listener: (reqId: number) => void): this;

  /**
   * Provides the xml-formatted parameters available from TWS market scanners (not all available in API).
   *
   * @param listener
   * xml: The xml-formatted string with the available parameters.
   *
   * @see [[reqScannerParameters]]
   */
  on(event: EventName.scannerParameters, listener: (xml: string) => void): this;

  /**
   * Provides the option chain for an underlying on an exchange specified in reqSecDefOptParams.
   * There will be multiple callbacks to securityDefinitionOptionParameter if multiple exchanges are specified in reqSecDefOptParams.
   *
   * @param listener
   * reqId: The id of request.
   *
   * underlyingConId: The conID of the underlying security.
   *
   * tradingClass: The option trading class.
   *
   * multiplier: The option multiplier.
   *
   * expirations: An array of the expiries for the options of this underlying on this exchange.
   *
   * strikes:  An array	of of the possible strikes for options of this underlying on this exchange.
   *
   * @see [[reqSecDefOptParams]]
   */
  on(
    event: EventName.securityDefinitionOptionParameter,
    listener: (
      reqId: number,
      exchange: string,
      underlyingConId: number,
      tradingClass: string,
      multiplier: string,
      expirations: string[],
      strikes: number[]
    ) => void
  ): this;

  /**
   * Called when all callbacks to securityDefinitionOptionParameter are complete.
   *
   * @param listener
   * reqId: The id of request.
   *
   * @see [[reqSecDefOptParams]]
   */
  on(
    event: EventName.securityDefinitionOptionParameterEnd,
    listener: (reqId: number) => void
  ): this;

  /**
   * Bit number to exchange + exchange abbreviation dictionary.
   *
   * @param listener
   * reqId: The id of request.
   *
   * @see [[reqSmartComponents]]
   */
  on(
    event: EventName.smartComponents,
    listener: (reqId: number, theMap: Map<number, [string, string]>) => void
  ): this;

  /**
   * Called when receives Soft Dollar Tier configuration information.
   *
   * @param listener
   * reqId: The id of request.
   *
   * tiers:	An array of [[SoftDollarTier]] objects that contains all Soft Dollar Tiers information.
   *
   * @see [[reqSoftDollarTiers]]
   */
  on(
    event: EventName.softDollarTiers,
    listener: (reqId: number, tiers: SoftDollarTier[]) => void
  ): this;

  /**
   * Provides an array of sample contract descriptions.
   *
   * @param listener
   * reqId: The id of request.
   *
   * tiers:	An array of  [[ContractDescription]]  objects.
   *
   * @see [[reqMatchingSymbols]]
   */
  on(
    event: EventName.symbolSamples,
    listener: (
      reqId: number,
      contractDescriptions: ContractDescription[]
    ) => void
  ): this;

  /**
   * Provides "Last" or "AllLast" tick-by-tick real-time tick.
   *
   * @param listener
   * reqId: The id of request.
   *
   * tickType: The tick-by-tick real-time tick type: "Last" or "AllLast".
   *
   * time: The tick-by-tick real-time tick timestamp.
   *
   * price: The tick-by-tick real-time tick last price.
   *
   * size: The tick-by-tick real-time tick last size.
   *
   * tickAttribLast: The tick-by-tick real-time last tick attribs (bit 0 - past limit, bit 1 - unreported).
   *
   * exchange: The tick-by-tick real-time tick exchange.
   *
   * specialConditions: The tick-by-tick real-time tick special conditions.
   *
   * @see [[reqTickByTickData]]
   */
  on(
    event: EventName.tickByTickAllLast,
    listener: (
      reqId: number,
      tickType: number,
      time: number,
      price: number,
      size: number,
      tickAttribLast: unknown /* TODO: replace with TickAttribLast type as soon as available. */
    ) => void
  ): this;

  /**
   * Provides "BidAsk" tick-by-tick real-time tick.
   *
   * @param listener
   * reqId: The id of request.
   *
   * time: The tick-by-tick real-time tick timestamp.
   *
   * bidPrice: The tick-by-tick real-time tick bid price.
   *
   * askPrice: The  tick-by-tick real-time tick ask price.
   *
   * bidSize: The tick-by-tick real-time tick bid size.
   *
   * askSize: The  tick-by-tick real-time tick ask size.
   *
   * tickAttribLast: The tick-by-tick real-time bid/ask tick attribs (bit 0 - bid past low, bit 1 - ask past high).
   *
   * @see [[reqTickByTickData]]
   */
  on(
    event: EventName.tickByTickBidAsk,
    listener: (
      reqId: number,
      time: number,
      bidPrice: number,
      askPrice: number,
      bidSize: number,
      askSize: number,
      tickAttribBidAsk: unknown /* TODO: replace with TickAttribBidAsk type as soon as available. */
    ) => void
  ): this;

  /**
   * Provides "MidPoint" tick-by-tick real-time tick.
   *
   * @param listener
   * reqId: The id of request.
   *
   * time: The tick-by-tick real-time tick timestamp.
   *
   * midPoint: The tick-by-tick real-time tick mid point.
   *
   * @see [[reqTickByTickData]]
   */
  on(
    event: EventName.tickByTickMidPoint,
    listener: (reqId: number, time: number, midPoint: number) => void
  ): this;

  /**
   * Exchange for Physicals.
   *
   * @param listener
   * tickerId: The request's identifier.
   *
   * tickType: The type of tick being received.
   *
   * basisPoints: Annualized basis points, which is representative of the financing rate that can be directly compared to broker rates.
   *
   * formattedBasisPoints: Annualized basis points as a formatted string that depicts them in percentage form.
   *
   * impliedFuture: The implied Futures price.
   *
   * holdDays: The number of hold days until the lastTradeDate of the EFP.
   *
   * futureLastTradeDate: The expiration date of the single stock future.
   *
   * dividendImpact: The dividend impact upon the annualized basis points interest rate.
   *
   * dividendsToLastTradeDate: The dividends expected until the expiration of the single stock future.
   */
  on(
    event: EventName.tickEFP,
    listener: (
      tickerId: number,
      tickType: number,
      basisPoints: number,
      formattedBasisPoints: string,
      impliedFuture: number,
      holdDays: number,
      futureLastTradeDate: string,
      dividendImpact: number,
      dividendsToLastTradeDate: number
    ) => void
  ): this;

  /**
   * Provides a market data generic tick.
   *
   * @param listener
   * tickerId: The id of request.
   *
   * field: The type of tick being received.
   *
   * value: The tick value.
   *
   * @see [[reqTickByTickData]]
   */
  on(
    event: EventName.tickGeneric,
    listener: (tickerId: number, field: TickType, value: number) => void
  ): this;

  /**
   * Provides a news headline tick.
   *
   * @param listener
   * tickerId: The id of request.
   *
   * field: The type of tick being received.
   *
   * value: The tick value.
   *
   * @see [[reqTickByTickData]]
   */
  on(
    event: EventName.tickNews,
    listener: (
      tickerId: number,
      timeStamp: number,
      providerCode: string,
      articleId: string,
      headline: string,
      extraData: string
    ) => void
  ): this;

  /**
   * Provides option specific market data.
   * This method is called when the market in an option or its underlier moves.
   * TWS option model volatilities, prices, and deltas, along with the present value of dividends expected on that options underlier are received.
   *
   * @param listener
   * tickerId: The id of request.
   *
   * field:	Specifies the type of option computation.
   * Pass the field value into [[TickType.getField]] to retrieve the field description.
   * For example, a field value of 13 will map to modelOptComp, etc. 10 = Bid 11 = Ask 12 = Last
   *
   * impliedVolatility: The implied volatility calculated by the TWS option modeler, using the specified tick type value.
   *
   * tickAttrib: 0 - return based, 1- price based.
   *
   * delta: The option delta value.
   *
   * value: The tick value.
   *
   * optPrice: The option price.
   *
   * pvDividend: The present value of dividends expected on the option's underlying.
   *
   * gamma:The option gamma value.
   *
   * vega: The option vega value.
   *
   * theta: The option theta value.
   *
   * undPrice: The price of the underlying.
   *
   * @see [[reqMktData]]
   */
  on(
    event: EventName.tickOptionComputation,
    listener: (
      tickerId: number,
      field: TickType,
      tickAttrib: number,
      impliedVolatility: number,
      delta: number,
      optPrice: number,
      pvDividend: number,
      gamma: number,
      vega: number,
      theta: number,
      undPrice: number
    ) => void
  ): this;

  /**
   * Market data tick price callback. Handles all price related ticks.
   * Every tickPrice callback is followed by a tickSize.
   * A tickPrice value of -1 or 0 followed by a tickSize of 0 indicates there is no data for this field currently available,
   * whereas a tickPrice with a positive tickSize indicates an active quote of 0 (typically for a combo contract).
   *
   * @param listener
   * tickerId: The id of request.
   *
   * field: The type of the price being received.
   *
   * price: The actual price.
   *
   * value: The tick value.
   *
   * attribs: An [[TickAttrib]] object that contains price attributes.
   *
   * @see [[reqMktData]]
   */
  on(
    event: EventName.tickPrice,
    listener: (
      tickerId: number,
      field: TickType,
      value: number,
      attribs: unknown /* TODO: replace with TickAttrib type as soon as available. */
    ) => void
  ): this;

  /**
   * A tick with BOO exchange and snapshot permissions.
   *
   * @param listener
   * tickerId: The id of request.
   *
   * @see [[reqMktData]]
   */
  on(
    event: EventName.tickReqParams,
    listener: (
      tickerId: number,
      minTick: number,
      bboExchange: string,
      snapshotPermissions: number
    ) => void
  ): this;

  /**
   * Market data tick size callback. Handles all size-related ticks.
   *
   * @param listener
   * tickerId: The id of request.
   *
   * field: The type of size being received (i.e. bid size)
   *
   * size: The actual size. US stocks have a multiplier of 100.
   *
   * @see [[reqMktData]]
   */
  on(
    event: EventName.tickSize,
    listener: (tickerId: number, field: TickType, value: number) => void
  ): this;

  /**
   * Market data callback. Every tickPrice is followed by a tickSize.
   * There are also independent tickSize callbacks anytime the tickSize changes, and so there will be duplicate tickSize messages following a tickPrice.
   *
   * @param listener
   * tickerId: The id of request.
   *
   * field: The type of size being received (i.e. bid size)
   *
   * value: The tick value.
   *
   * @see [[reqMktData]]
   */
  on(
    event: EventName.tickString,
    listener: (tickerId: number, field: TickType, value: string) => void
  ): this;

  /**
   * Receives the last time on which the account was updated.
   *
   * @param listener
   * timestamp: The last update system time.
   *
   * @see [[reqMktData]]
   */
  on(
    event: EventName.updateAccountTime,
    listener: (timestamp: string) => void
  ): this;

  /**
   * Receives the subscribed account's information.
   * Only one account can be subscribed at a time. After the initial callback to updateAccountValue,
   * callbacks only occur for values which have changed.
   * This occurs at the time of a position change, or every 3 minutes at most.
   * This frequency cannot be adjusted.
   *
   * @param listener
   * key: The value being updated. Possible values:
   * - AccountCode: The account ID number.
   * - AccountOrGroup: "All" to return account summary data for all accounts, or set to a specific Advisor Account Group name that has already been created in TWS Global Configuration.
   * - AccountReady: For internal use only.
   * - AccountType: Identifies the IB account structure.
   * - AccruedCash: Total accrued cash value of stock, commodities and securities.
   * - AccruedCash-C: Reflects the current's month accrued debit and credit interest to date, updated daily in commodity segment.
   * - AccruedCash-S: Reflects the current's month accrued debit and credit interest to date, updated daily in security segment.
   * - AccruedDividend: Total portfolio value of dividends accrued.
   * - AccruedDividend-C: Dividends accrued but not paid in commodity segment.
   * - AccruedDividend-S: Dividends accrued but not paid in security segment.
   * - AvailableFunds: This value tells what you have available for trading.
   * - AvailableFunds-C: Net Liquidation Value - Initial Margin.
   * - AvailableFunds-S: Equity with Loan Value - Initial Margin.
   * - Billable: Total portfolio value of treasury bills.
   * - Billable-C: Value of treasury bills in commodity segment.
   * - Billable-S: Value of treasury bills in security segment.
   * - BuyingPower: Cash Account: Minimum (Equity with Loan Value, Previous Day Equity with Loan Value)-Initial Margin, Standard Margin Account: Minimum (Equity with Loan Value, Previous Day Equity with Loan Value) - Initial Margin *4.
   * - CashBalance: Cash recognized at the time of trade + futures PNL.
   * - CorporateBondValue: Value of non-Government bonds such as corporate bonds and municipal bonds.
   * - Currency: Open positions are grouped by currency.
   * - Cushion: Excess liquidity as a percentage of net liquidation value.
   * - DayTradesRemaining: Number of Open/Close trades one could do before Pattern Day Trading is detected.
   * - DayTradesRemainingT+1: Number of Open/Close trades one could do tomorrow before Pattern Day Trading is detected.
   * - DayTradesRemainingT+2: Number of Open/Close trades one could do two days from today before Pattern Day Trading is detected.
   * - DayTradesRemainingT+3: Number of Open/Close trades one could do three days from today before Pattern Day Trading is detected.
   * - DayTradesRemainingT+4: Number of Open/Close trades one could do four days from today before Pattern Day Trading is detected.
   * - EquityWithLoanValue: Forms the basis for determining whether a client has the necessary assets to either initiate or maintain security positions.
   * - EquityWithLoanValue-C: Cash account: Total cash value + commodities option value - futures maintenance margin requirement + minimum (0, futures PNL) Margin account: Total cash value + commodities option value - futures maintenance margin requirement.
   * - EquityWithLoanValue-S: Cash account: Settled Cash Margin Account: Total cash value + stock value + bond value + (non-U.S. & Canada securities options value).
   * - ExcessLiquidity: This value shows your margin cushion, before liquidation.
   * - ExcessLiquidity-C: Equity with Loan Value - Maintenance Margin.
   * - ExcessLiquidity-S: Net Liquidation Value - Maintenance Margin.
   * - ExchangeRate: The exchange rate of the currency to your base currency.
   * - FullAvailableFunds: Available funds of whole portfolio with no discounts or intraday credits.
   * - FullAvailableFunds-C: Net Liquidation Value - Full Initial Margin.
   * - FullAvailableFunds-S: Equity with Loan Value - Full Initial Margin.
   * - FullExcessLiquidity: Excess liquidity of whole portfolio with no discounts or intraday credits.
   * - FullExcessLiquidity-C: Net Liquidation Value - Full Maintenance Margin.
   * - FullExcessLiquidity-S: Equity with Loan Value - Full Maintenance Margin.
   * - FullInitMarginReq: Initial Margin of whole portfolio with no discounts or intraday credits.
   * - FullInitMarginReq-C: Initial Margin of commodity segment's portfolio with no discounts or intraday credits.
   * - FullInitMarginReq-S: Initial Margin of security segment's portfolio with no discounts or intraday credits.
   * - FullMaintMarginReq: Maintenance Margin of whole portfolio with no discounts or intraday credits.
   * - FullMaintMarginReq-C: Maintenance Margin of commodity segment's portfolio with no discounts or intraday credits.
   * - FullMaintMarginReq-S: Maintenance Margin of security segment's portfolio with no discounts or intraday credits.
   * - FundValue: Value of funds value (money market funds + mutual funds).
   * - FutureOptionValue: Real-time market-to-market value of futures options.
   * - FuturesPNL: Real-time changes in futures value since last settlement.
   * - FxCashBalance: Cash balance in related IB-UKL account.
   * - GrossPositionValue: Gross Position Value in securities segment.
   * - GrossPositionValue-S: Long Stock Value + Short Stock Value + Long Option Value + Short Option Value.
   * - IndianStockHaircut: Margin rule for IB-IN accounts.
   * - InitMarginReq: Initial Margin requirement of whole portfolio.
   * - InitMarginReq-C: Initial Margin of the commodity segment in base currency.
   * - InitMarginReq-S: Initial Margin of the security segment in base currency.
   * - IssuerOptionValue: Real-time mark-to-market value of Issued Option.
   * - Leverage-S: GrossPositionValue / NetLiquidation in security segment.
   * - LookAheadNextChange: Time when look-ahead values take effect.
   * - LookAheadAvailableFunds: This value reflects your available funds at the next margin change.
   * - LookAheadAvailableFunds-C: Net Liquidation Value - look ahead Initial Margin.
   * - LookAheadAvailableFunds-S: Equity with Loan Value - look ahead Initial Margin.
   * - LookAheadExcessLiquidity: This value reflects your excess liquidity at the next margin change.
   * - LookAheadExcessLiquidity-C: Net Liquidation Value - look ahead Maintenance Margin.
   * - LookAheadExcessLiquidity-S: Equity with Loan Value - look ahead Maintenance Margin.
   * - LookAheadInitMarginReq: Initial margin requirement of whole portfolio as of next period's margin change.
   * - LookAheadInitMarginReq-C: Initial margin requirement as of next period's margin change in the base currency of the account.
   * - LookAheadInitMarginReq-S: Initial margin requirement as of next period's margin change in the base currency of the account.
   * - LookAheadMaintMarginReq: Maintenance margin requirement of whole portfolio as of next period's margin change.
   * - LookAheadMaintMarginReq-C: Maintenance margin requirement as of next period's margin change in the base currency of the account.
   * - LookAheadMaintMarginReq-S: Maintenance margin requirement as of next period's margin change in the base currency of the account.
   * - MaintMarginReq: Maintenance Margin requirement of whole portfolio.
   * - MaintMarginReq-C: Maintenance Margin for the commodity segment.
   * - MaintMarginReq-S: Maintenance Margin for the security segment.
   * - MoneyMarketFundValue: Market value of money market funds excluding mutual funds.
   * - MutualFundValue: Market value of mutual funds excluding money market funds.
   * - NetDividend: The sum of the Dividend Payable/Receivable Values for the securities and commodities segments of the account.
   * - NetLiquidation: The basis for determining the price of the assets in your account.
   * - NetLiquidation-C: Total cash value + futures PNL + commodities options value.
   * - NetLiquidation-S: Total cash value + stock value + securities options value + bond value.
   * - NetLiquidationByCurrency: Net liquidation for individual currencies.
   * - OptionMarketValue: Real-time mark-to-market value of options.
   * - PASharesValue: Personal Account shares value of whole portfolio.
   * - PASharesValue-C: Personal Account shares value in commodity segment.
   * - PASharesValue-S: Personal Account shares value in security segment.
   * - PostExpirationExcess: Total projected "at expiration" excess liquidity.
   * - PostExpirationExcess-C: Provides a projected "at expiration" excess liquidity based on the soon-to expire contracts in your portfolio in commodity segment.
   * - PostExpirationExcess-S: Provides a projected "at expiration" excess liquidity based on the soon-to expire contracts in your portfolio in security segment.
   * - PostExpirationMargin: Total projected "at expiration" margin.
   * - PostExpirationMargin-C: Provides a projected "at expiration" margin value based on the soon-to expire contracts in your portfolio in commodity segment.
   * - PostExpirationMargin-S: Provides a projected "at expiration" margin value based on the soon-to expire contracts in your portfolio in security segment.
   * - PreviousDayEquityWithLoanValue: Marginable Equity with Loan value as of 16:00 ET the previous day in securities segment.
   * - PreviousDayEquityWithLoanValue-S: IMarginable Equity with Loan value as of 16:00 ET the previous day.
   * - RealCurrency: Open positions are grouped by currency.
   * - RealizedPnL: Shows your profit on closed positions, which is the difference between your entry execution cost and exit execution costs, or (execution price + commissions to open the positions) - (execution price + commissions to close the position).
   * - RegTEquity: Regulation T equity for universal account.
   * - RegTEquity-S: Regulation T equity for security segment.
   * - RegTMargin: Regulation T margin for universal account.
   * - RegTMargin-S: Regulation T margin for security segment.
   * - SMA: Line of credit created when the market value of securities in a Regulation T account increase in value.
   * - SMA-S: Regulation T Special Memorandum Account balance for security segment.
   * - SegmentTitle: Account segment name.
   * - StockMarketValue: Real-time mark-to-market value of stock.
   * - TBondValue: Value of treasury bonds.
   * - TBillValue: Value of treasury bills.
   * - TotalCashBalance: Total Cash Balance including Future PNL.
   * - TotalCashValue: Total cash value of stock, commodities and securities.
   * - TotalCashValue-C: CashBalance in commodity segment.
   * - TotalCashValue-S: CashBalance in security segment.
   * - TradingType-S: Account Type.
   * - UnrealizedPnL: The difference between the current market value of your open positions and the average cost, or Value - Average Cost.
   * - WarrantValue: Value of warrants.
   * - WhatIfPMEnabled: To check projected margin requirements under Portfolio Margin model.
   *
   * @see [[reqAccountUpdates]]
   */
  on(
    event: EventName.updateAccountValue,
    listener: (
      key: string,
      value: string,
      currency: string,
      accountName: string
    ) => void
  ): this;

  /**
   * Receives the subscribed account's portfolio.
   *
   * This function will receive only the portfolio of the subscribed account.
   *
   * If the portfolios of all managed accounts are needed, refer to [[reqPosition]].
   *
   * After the initial callback to `updatePortfolio`, callbacks only occur for positions which have changed.
   *
   * @param listener
   * contract: The Contract for which a position is held.
   *
   * position: The number of positions held.
   *
   * marketPrice: Instrument's unitary price.
   *
   * marketValue: Total market value of the instrument.
   *
   * averageCost: Average acquiring price of the instrument.
   *
   * unrealizedPNL: Unrealized Profit/Loss.
   *
   * realizedPNL: Realized Profit/Loss.
   *
   * accountName: The account name.
   */
  on(
    event: EventName.updatePortfolio,
    listener: (
      contract: Contract,
      position: number,
      marketPrice: number,
      marketValue: number,
      averageCost: number,
      unrealizedPNL: number,
      realizedPNL: number,
      accountName: string
    ) => void
  ): this;

  /**
   * Returns the order book.
   *
   * @param listener
   * tickerId: The request's identifier.
   *
   * position: The order book's row being updated.
   *
   * operation: How to refresh the row:
   * - 0 = insert (insert this new order into the row identified by 'position')
   * - 1 = update (update the existing order in the row identified by 'position')
   * - 2 = delete (delete the existing order at the row identified by 'position')
   *
   * side: 0 for ask, 1 for bid.
   *
   * price: The order's price.
   *
   * size: The order's size.
   *
   * @see [[reqMktDepth]]
   */
  on(
    event: EventName.updateMktDepth,
    listener: (
      tickerId: number,
      position: number,
      operation: number,
      side: number,
      price: number,
      size: number
    ) => void
  ): this;

  /**
   * Returns the order book (level 2).
   *
   * @param listener
   * tickerId: The request's identifier.
   *
   * position: The order book's row being updated.
   *
   * marketMaker: The exchange holding the order if isSmartDepth is `true`, otherwise the MPID of the market maker.
   *
   * operation: How to refresh the row:
   * - 0 = insert (insert this new order into the row identified by 'position')
   * - 1 = update (update the existing order in the row identified by 'position')
   * - 2 = delete (delete the existing order at the row identified by 'position')
   *
   * side: 0 for ask, 1 for bid.
   *
   * price: The order's price.
   *
   * size: The order's size.
   *
   * isSmartDepth: A flag indicating if this is smart depth response (aggregate data from multiple exchanges, v974+)
   *
   * @see [[reqMktDepth]]
   */
  on(
    event: EventName.updateMktDepthL2,
    listener: (
      tickerId: number,
      position: number,
      marketMaker: string,
      operation: number,
      side: number,
      price: number,
      size: number,
      isSmartDepth: boolean
    ) => void
  ): this;

  /**
   * Provides IB's bulletins.
   *
   * @param listener
   * msgId: The bulletin's identifier.
   *
   * msgType:	one of:
   * - 1: Regular news bulletin
   * - 2: Exchange no longer available for trading
   * - 3: Exchange is available for trading
   *
   * message: The message.
   *
   * origExchange: The exchange where the message comes from.
   */
  on(
    event: EventName.updateNewsBulletin,
    listener: (
      msgId: number,
      msgType: number,
      message: string,
      origExchange: string
    ) => void
  ): this;
}
