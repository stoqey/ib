import { SoftDollarTier, TagValue } from "../api";
import { SecType } from "../contract/contract";
import { OrderType } from "./orderType";
import { OrderComboLeg } from "./orderComboLeg";

/**
 * Order action.
 */
export enum OrderAction {
  BUY = "BUY",
  SELL = "SELL",
}

/**
 * Order condition types.
 */
export enum OrderConditionType {
  Price = 1,
  Time = 3,
  Margin = 4,
  Execution = 5,
  Volume = 6,
  PercentChange = 7,
}

/**
 * Order condition conjunction connections.
 */
export enum ConjunctionConnection {
  AND = "a",
  OR = "o",
}

/**
 * An order execution condition
 */
export interface OrderCondition {
  /** Condition type */
  type: OrderConditionType;

  /** Conjunction connection type. */
  conjunctionConnection: ConjunctionConnection;
}

/**
 * TODO document
 */
export interface OperatorCondition extends OrderCondition {
  /** TODO document */
  isMore: boolean;

  /** Value as string representation. */
  readonly strValue: string;
}

/**
 * An order execution condition with contract details.
 */
export interface ContractCondition extends OperatorCondition {
  /** The contract id. */
  conId: number;

  /** The exchange code. */
  exchange: string;
}

/**
 * This class represents a condition requiring a specific execution event to be fulfilled.
 *
 * Orders can be activated or canceled if a set of given conditions is met.
 * An ExecutionCondition is met whenever a trade occurs on a certain product at the given exchange.
 */
export class ExecutionCondition implements OrderCondition {
  type = OrderConditionType.Execution;

  /**
   * Create a [[ExecutionCondition]] object.
   *
   * @param exchange Exchange where the symbol needs to be traded.
   * @param secType Kind of instrument being monitored.
   * @param symbol 	Instrument's symbol.
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public exchange: string,
    public secType: SecType,
    public symbol: string,
    public conjunctionConnection: ConjunctionConnection
  ) {}
}

/**
 * TODO document
 */
export class MarginCondition implements OperatorCondition {
  type = OrderConditionType.Margin;

  /**
   * Create a [[MarginCondition]] object.
   *
   * @param percent TODO document
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public percent: number,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection
  ) {}

  get strValue(): string {
    return "" + this.percent;
  }
}

/**
 * Used with conditional orders to place or submit an order based on a percentage change of an instrument to the last close price.
 */
export class PercentChangeCondition implements ContractCondition {
  type = OrderConditionType.PercentChange;

  /**
   * Create a [[PercentChangeCondition]] object.
   *
   * @param percent TODO document
   * @param conId The contract id.
   * @param exchange The exchange code.
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public percent: number,
    public conId: number,
    public exchange: string,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection
  ) {}

  get strValue(): string {
    return "" + this.percent;
  }
}

/**
 * [[PriceCondition]] trigger method.
 */
export enum TriggerMethod {
  Default = 0,
  DoubleBidAsk = 1,
  Last = 2,
  DoubleLast = 3,
  BidAsk = 4,
  LastOfBidAsk = 7,
  MidPoint = 8,
}

/**
 * Used with conditional orders to cancel or submit order based on price of an instrument.
 */
export class PriceCondition implements ContractCondition {
  type = OrderConditionType.Price;

  /**
   * Create a [[PriceCondition]] object.
   *
   * @param conId The contract id.
   * @param exchange The exchange code.
   * @param price TODO document
   * @param triggerMethod TODO document
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public price: number,
    public triggerMethod: TriggerMethod,
    public conId: number,
    public exchange: string,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection
  ) {}

  get strValue(): string {
    return "" + this.price;
  }
}

/**
 * TODO document
 */
export class TimeCondition implements OperatorCondition {
  type = OrderConditionType.Time;

  /**
   * Create a [[TimeCondition]] object.
   *
   * @param time Time field used in conditional order logic. Valid format: YYYYMMDD HH:MM:SS.
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public time: string,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection
  ) {}

  get strValue(): string {
    return this.time;
  }
}

/**
 * Used with conditional orders to submit or cancel an order based on a specified volume change in a security.
 */
export class VolumeCondition implements ContractCondition {
  type = OrderConditionType.Volume;

  /**
   * Create a [[PriceCondition]] object.
   *
   * @param volume TODO document
   * @param conId The contract id.
   * @param exchange The exchange code.
   * @param triggerMethod TODO document
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public volume: number,
    public conId: number,
    public exchange: string,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection
  ) {}

  get strValue(): string {
    return "" + this.volume;
  }
}

/**
 * The order's description.
 */
export interface Order {
  /** The API client's order id. */
  orderId?: number;

  /** TODO document */
  solicited?: boolean;

  /** The API client id which placed the order. */
  clientId?: number;

  /** The Host order identifier. */
  permId?: number;

  /**
   * Identifies the side.
   *
   * Generally available values are BUY, SELL.
   *
   * Additionally, SSHORT, SLONG are available in some institutional-accounts only.
   *
   * For general account types, a SELL order will be able to enter a short position automatically if the order quantity is larger than your current long position.
   *
   * SSHORT is only supported for institutional account configured with Long/Short account segments or clearing with a separate account.
   *
   * SLONG is available in specially-configured institutional accounts to indicate that long position not yet delivered is being sold.
   */
  action?: OrderAction;

  /** The number of positions being bought/sold. */
  totalQuantity?: number;

  /** The order's type. */
  orderType?: OrderType;

  /**
   * The LIMIT price.
   *
   * Used for limit, stop-limit and relative orders.
   * In all other cases specify zero.
   * For relative orders with no limit price, also specify zero.
   */
  lmtPrice?: number;

  /** Generic field to contain the stop price for STP LMT orders, trailing amount, etc.  */
  auxPrice?: number;

  /**
   * The time in force.
   *
   * Valid values are:
   * - DAY - Valid for the day only.
   * - GTC - Good until canceled.
   * The order will continue to work within the system and in the marketplace until it executes or is canceled.
   * GTC orders will be automatically be cancelled under the following conditions:
   * If a corporate action on a security results in a stock split (forward or reverse), exchange for shares, or distribution of shares.
   * If you do not log into your IB account for 90 days.
   * At the end of the calendar quarter following the current quarter.
   * For example, an order placed during the third quarter of 2011 will be canceled at the end of the first quarter of 2012.
   * If the last day is a non-trading day, the cancellation will occur at the close of the final trading day of that quarter.
   * For example, if the last day of the quarter is Sunday, the orders will be cancelled on the preceding Friday.
   * Orders that are modified will be assigned a new “Auto Expire” date consistent with the end of the calendar quarter following the current quarter.
   * Orders submitted to IB that remain in force for more than one day will not be reduced for dividends.
   * To allow adjustment to your order price on ex-dividend date, consider using a Good-Til-Date/Time (GTD) or Good-after-Time/Date (GAT) order type, or a combination of the two.
   * - IOC - Immediate or Cancel. Any portion that is not filled as soon as it becomes available in the market is canceled.
   * - GTD. - Good until Date. It will remain working within the system and in the marketplace until it executes or until the close of the market on the date specified
   * - OPG - Use OPG to send a market-on-open (MOO) or limit-on-open (LOO) order.
   * - FOK - If the entire Fill-or-Kill order does not execute as soon as it becomes available, the entire order is canceled.
   * - DTC - Day until Canceled
   */
  tif?: string;

  /** One-Cancels-All group identifier. */
  ocaGroup?: string;

  /**
   * Tells how to handle remaining orders in an OCA group when one order or part of an order executes.
   *
   * Valid values are:
   * - 1 = Cancel all remaining orders with block.
   * - 2 = Remaining orders are proportionately reduced in size with block.
   * - 3 = Remaining orders are proportionately reduced in size with no block.
   *
   * If you use a value "with block" it gives the order overfill protection.
   * This means that only one order in the group will be routed at a time to remove the possibility of an overfill.
   */
  ocaType?: number;

  /**
   * The order reference.
   *
   * Intended for institutional customers only,
   * although all customers may use it to identify the API client that sent the order when multiple API clients are running.
   */
  orderRef?: string;

  /**
   * Specifies whether the order will be transmitted by TWS.
   * If set to false`, the order will be created at TWS but will not be sent.
   */
  transmit?: boolean;

  /** The order ID of the parent order, used for bracket and auto trailing stop orders. */
  parentId?: number;

  /** If set to `true`, specifies that the order is an ISE Block order. */
  blockOrder?: boolean;

  /** If set to `true`, specifies that the order is a Sweep-to-Fill order. */
  sweepToFill?: boolean;

  /** The publicly disclosed order size, used when placing Iceberg orders. */
  displaySize?: number;

  /**
   * Specifies how Simulated Stop, Stop-Limit and Trailing Stop orders are triggered.
   *
   * Valid values are:
   * - 0 - The default value. The "double bid/ask" function will be used for orders for OTC stocks and US options. All other orders will used the "last" function.
   * - 1 - use "double bid/ask" function, where stop orders are triggered based on two consecutive bid or ask prices.
   * - 2 - "last" function, where stop orders are triggered based on the last price.
   * - 3 - double last function.
   * - 4 - bid/ask function.
   * - 7 - last or bid/ask function.
   * - 8 - mid-point function.
   */
  triggerMethod?: number;

  /** If set to `true`, allows orders to also trigger or fill outside of regular trading hours. */
  outsideRth?: boolean;

  /**
   * If set to `true`, the order will not be visible when viewing the market depth.
   * This option only applies to orders routed to the ISLAND exchange.
   */
  hidden?: boolean;

  /**
   * Specifies the date and time after which the order will be active.
   * Format: yyyymmdd hh:mm:ss {optional Timezone}.
   */
  goodAfterTime?: string;

  /**
   * The date and time until the order will be active.
   * You must enter GTD as the time in force to use this string.
   * The trade's "Good Till Date," format "YYYYMMDD hh:mm:ss (optional time zone)".
   */
  goodTillDate?: string;

  /**
   * Overrides TWS constraints.
   * Precautionary constraints are defined on the TWS Presets page, and help ensure that your price and size order values are reasonable.
   * Orders sent from the API are also validated against these safety constraints, and may be rejected if any constraint is violated.
   *
   * To override validation, set this parameter’s value to `true`.
   */
  overridePercentageConstraints?: boolean;

  /**
   * Possible values:
   * - Individual = 'I'
   * - Agency = 'A'
   * - AgentOtherMember = 'W'
   * - IndividualPTIA = 'J'
   * - AgencyPTIA = 'U'
   * - AgentOtherMemberPTIA = 'M'
   * - IndividualPT = 'K'
   * - AgencyPT = 'Y'
   * - AgentOtherMemberPT = 'N'
   */
  rule80A?: string;

  /** Indicates whether or not all the order has to be filled on a single execution. */
  allOrNone?: boolean;

  /** Identifies a minimum quantity order type. */
  minQty?: number;

  /** The percent offset amount for relative orders. */
  percentOffset?: number;

  /** Trail stop price for TRAILIMIT orders.  */
  trailStopPrice?: number;

  /**
   * Specifies the trailing amount of a trailing stop order as a percentage.
   *
   * This field is mutually exclusive with the existing trailing amount.
   * That is, the API client can send one or the other but not both.
   *
   * This field is read AFTER the stop price (barrier price) as follows: deltaNeutralAuxPrice stopPrice, trailingPercent, scale order attributes
   *
   * The field will also be sent to the API in the openOrder message if the API client version is >= 56.
   * It is sent after the stopPrice field as follows: stopPrice, trailingPct, basisPoint
   */
  trailingPercent?: number;

  /** The Financial Advisor group the trade will be allocated to. Use an empty string if not applicable. */
  faGroup?: string;

  /** The Financial Advisor allocation profile the trade will be allocated to. Use an empty string if not applicable. */
  faProfile?: string;

  /** The Financial Advisor allocation method the trade will be allocated to. Use an empty string if not applicable.FaMethod */
  faMethod?: string;

  /** The Financial Advisor percentage concerning the trade's allocation. Use an empty string if not applicable. */
  faPercentage?: string;

  /**
   * For institutional customers only.
   *
   * Valid values are O (open), C (close).
   *
   * Available for institutional clients to determine if this order is to open or close a position.
   *
   * When Action = "BUY" and OpenClose = "O" this will open a new position.
   *
   * When Action = "BUY" and OpenClose = "C" this will close and existing short position.
   */
  openClose?: string;

  /**
   * The order's origin.  Same as TWS "Origin" column.
   *
   * Identifies the type of customer from which the order originated.
   *
   * Valid values are 0 (customer), 1 (firm).
   */
  origin?: number;

  /**
   * For institutions only.
   * Valid values are:
   * - 1 - broker holds shares.
   * - 2 - shares come from elsewhere.
   */
  shortSaleSlot?: number;

  /**
   * Used only when shortSaleSlot is 2.
   *
   * For institutions only.
   *
   * Indicates the location where the shares to short come from.
   * Used only when short sale slot is set to 2 (which means that the shares to short are held elsewhere and not with IB).
   */
  designatedLocation?: string;

  /** Only available with IB Execution-Only accounts with applicable securities Mark order as exempt from short sale uptick rule. */
  exemptCode?: number;

  /** The amount off the limit price allowed for discretionary orders. */
  discretionaryAmt?: number;

  /** Trade with electronic quotes. */
  eTradeOnly?: boolean;

  /** Trade with firm quotes. */
  firmQuoteOnly?: boolean;

  /** Maximum smart order distance from the NBBO. */
  nbboPriceCap?: number;

  /**
   * Use to opt out of default SmartRouting for orders routed directly to ASX.
   * This attribute defaults to false unless explicitly set to `true`.
   *
   * When set to `false`, orders routed directly to ASX will NOT use SmartRouting.
   * When set to `true`, orders routed directly to ASX orders WILL use SmartRouting.
   */
  optOutSmartRouting?: boolean;

  /**
   * For BOX orders only.
   *
   * Possible values:
   * - 1 - match
   * - 2 - improvement
   * - 3 - transparent
   */
  auctionStrategy?: number;

  /** The auction's starting price. For BOX orders only. */
  startingPrice?: number;

  /**
   * The stock's reference price.
   * The reference price is used for VOL orders to compute the limit price sent to an exchange  (whether or not Continuous Update is selected),
   * and for price range monitoring.
   */
  stockRefPrice?: number;

  /** The stock's Delta. For orders on BOX only. */
  delta?: number;

  /**
   * The lower value for the acceptable underlying stock price range.
   * For price improvement option orders on BOX and VOL orders with dynamic management.
   */
  stockRangeLower?: number;

  /**
   * The upper value for the acceptable underlying stock price range.
   * For price improvement option orders on BOX and VOL orders with dynamic management.
   */
  stockRangeUpper?: number;

  /**
   * The option price in volatility, as calculated by TWS' Option Analytics.
   * This value is expressed as a percent and is used to calculate the limit price sent to the exchange.
   */
  volatility?: number;

  /**
   * Values include:
   * - 1 - Daily Volatility
   * - 2 - Annual Volatility.
   */
  volatilityType?: number;

  /**
   * Specifies whether TWS will automatically update the limit price of the order as the underlying price moves.
   *
   * VOL orders only.
   */
  continuousUpdate?: number;

  /**
   * Specifies how you want TWS to calculate the limit price for options, and for stock range price monitoring.
   *
   * VOL orders only.
   *
   * Valid values include:
   * - 1 - Average of NBBO
   * - 2 - NBB or the NBO depending on the action and right.
   */
  referencePriceType?: number;

  /**
   * Enter an order type to instruct TWS to submit a delta neutral trade on full or partial execution of the VOL order.
   *
   * VOL orders only.
   *
   * For no hedge delta order to be sent, specify NONE.
   */
  deltaNeutralOrderType?: string;

  /**
   * Use this field to enter a value if the value in the deltaNeutralOrderType field is an order type that requires an Aux price, such as a REL order.
   *
   * VOL orders only.
   */
  deltaNeutralAuxPrice?: number;

  /** TODO document */
  deltaNeutralConId?: number;

  /** TODO document */
  deltaNeutralSettlingFirm?: string;

  /** TODO document */
  deltaNeutralClearingAccount?: string;

  /** TODO document */
  deltaNeutralClearingIntent?: string;

  /** Specifies whether the order is an Open or a Close order and is used when the hedge involves a CFD and and the order is clearing away. */
  deltaNeutralOpenClose?: string;

  /** Used when the hedge involves a stock and indicates whether or not it is sold short. */
  deltaNeutralShortSale?: boolean;

  /**
   * Has a value of 1 (the clearing broker holds shares) or 2 (delivered from a third party).
   * If you use 2, then you must specify a [[deltaNeutralDesignatedLocation]].
   */
  deltaNeutralShortSaleSlot?: number;

  /** Used only when [[deltaNeutralShortSaleSlot]] = 2. */
  deltaNeutralDesignatedLocation?: string;

  /** TODO document. For EFP orders only. */
  basisPoints?: number;

  /** TODO document. For EFP orders only. */
  basisPointsType?: number;

  /**
   * Defines the size of the first, or initial, order component.
   *
   * For Scale orders only.
   */
  scaleInitLevelSize?: number;

  /**
   * Defines the order size of the subsequent scale order components.
   *
   * For Scale orders only. Used in conjunction with scaleInitLevelSize().
   */
  scaleSubsLevelSize?: number;

  /**
   * Defines the price increment between scale components.
   *
   * For Scale orders only. This value is compulsory.
   */
  scalePriceIncrement?: number;

  /** TODO document. For extended Scale orders. */
  scalePriceAdjustValue?: number;

  /** TODO document. For extended Scale orders. */
  scalePriceAdjustInterval?: number;

  /** TODO document. For extended Scale orders. */
  scaleProfitOffset?: number;

  /** TODO document. For extended Scale orders. */
  scaleAutoReset?: boolean;

  /** TODO document. For extended Scale orders. */
  scaleInitPosition?: number;

  /** TODO document. For extended Scale orders. */
  scaleInitFillQty?: number;

  /** TODO document. For extended Scale orders. */
  scaleRandomPercent?: boolean;

  /**
   * For hedge orders.
   *
   * Possible values include:
   * - D - delta
   * - B - beta
   * - F - FX
   * - P - Pair
   */
  hedgeType?: string;

  /** Beta = x for Beta hedge orders, ratio = y for Pair hedge order */
  hedgeParam?: string;

  /** The account the trade will be allocated to. */
  account?: string;

  /**
   * Institutions only.
   *
   * Indicates the firm which will settle the trade.
   */
  settlingFirm?: string;

  /**
   * Specifies the true beneficiary of the order.
   *
   * For IBExecution customers.
   *
   * This value is required for FUT/FOP orders for reporting to the exchange.
   */
  clearingAccount?: string;

  /**
   * For execution-only clients to know where do they want their shares to be cleared at.
   * Valid values are: IB, Away, and PTA (post trade allocation).
   */
  clearingIntent?: string;

  /**
   * The algorithm strategy.
   *
   * As of API version 9.6, the following algorithms are supported:
   * - ArrivalPx - Arrival Price
   * - DarkIce - Dark Ice
   * - PctVol - Percentage of Volume
   * - Twap - TWAP (Time Weighted Average Price)
   * - Vwap - VWAP (Volume Weighted Average Price)
   *
   * For more information about IB's API algorithms, refer to https://www.interactivebrokers.com/en/software/api/apiguide/tables/ibalgo_parameters.htm.
   */
  algoStrategy?: string;

  /**
   * The list of parameters for the IB algorithm.
   *
   * For more information about IB's API algorithms, refer to https://www.interactivebrokers.com/en/software/api/apiguide/tables/ibalgo_parameters.htm.
   */
  algoParams?: TagValue[];

  /**
   * Allows to retrieve the commissions and margin information.
   *
   * When placing an order with this attribute set to `true, the order will not be placed as such.
   * Instead it will used to request the commissions and margin information that would result from this order.
   */
  whatIf?: boolean;

  /** TODO document. */
  algoId?: string;

  /**
   * Orders routed to IBDARK are tagged as “post only” and are held in IB's order book,
   * where incoming SmartRouted orders from other IB customers are eligible to trade against them.
   *
   * For IBDARK orders only.
   */
  notHeld?: boolean;

  /**
   * Advanced parameters for Smart combo routing.
   *
   * These features are for both guaranteed and non-guaranteed combination orders routed to Smart, and are available based on combo type and order type.
   * SmartComboRoutingParams is similar to AlgoParams in that it makes use of tag/value pairs to add parameters to combo orders.
   *
   * Make sure that you fully understand how Advanced Combo Routing works in TWS itself first: https://www.interactivebrokers.com/en/software/tws/usersguidebook/specializedorderentry/advanced_combo_routing.htm
   *
   * The parameters cover the following capabilities:
   *
   * - Non-Guaranteed - Determine if the combo order is Guaranteed or Non-Guaranteed.
   *
   * Tag = NonGuaranteed
   *
   * Value = 0: The order is guaranteed
   *
   * Value = 1: The order is non-guaranteed
   *
   * - Select Leg to Fill First - User can specify which leg to be executed first.
   *
   * Tag = LeginPrio
   *
   * Value = -1: No priority is assigned to either combo leg
   *
   * Value = 0: Priority is assigned to the first leg being added to the comboLeg
   *
   * Value = 1: Priority is assigned to the second leg being added to the comboLeg
   *
   * Note: The LeginPrio parameter can only be applied to two-legged combo.
   *
   * - Maximum Leg-In Combo Size - Specify the maximum allowed leg-in size per segment
   *
   * Tag = MaxSegSize
   *
   * Value = Unit of combo size
   *
   * - Do Not Start Next Leg-In if Previous Leg-In Did Not Finish - Specify whether or not the system should attempt to fill the next segment before the current segment fills.
   *
   * Tag = DontLeginNext
   *
   *
   * Value = 0: Start next leg-in even if previous leg-in did not finish
   * Value = 1: Do not start next leg-in if previous leg-in did not finish
   *
   * - Price Condition - Combo order will be rejected or cancelled if the leg market price is outside of the specified price range [CondPriceMin, CondPriceMax]
   *
   * Tag = PriceCondConid: The ContractID of the combo leg to specify price condition on
   *
   * Value = The ContractID
   *
   * Tag = CondPriceMin: The lower price range of the price condition
   *
   * Value = The lower price
   *
   * Tag = CondPriceMax: The upper price range of the price condition
   *
   * Value = The upper price
   */
  smartComboRoutingParams?: TagValue[];

  /**
   * List of Per-leg price following the same sequence combo legs are added.
   *
   * The combo price must be left unspecified when using per-leg prices.
   */
  orderComboLegs?: OrderComboLeg[];

  /** TODO document */
  orderMiscOptions?: TagValue[];

  /** For GTC orders. */
  activeStartTime?: TagValue[];

  /** For GTC orders. */
  activeStopTime?: TagValue[];

  /**	Used for scale orders. */
  scaleTable?: string;

  /* The model code. */
  modelCode?: string;

  /** This is a regulatory attribute that applies to all US Commodity (Futures) Exchanges, provided to allow client to comply with CFTC Tag 50 Rules. */
  extOperator?: string;

  /** Define the Soft Dollar Tier used for the order. Only provided for registered professional advisors and hedge and mutual funds. */
  softDollarTier?: SoftDollarTier;

  /** The native cash quantity. */
  cashQty?: number;

  /**
   * Identifies a person as the responsible party for investment decisions within the firm.
   *
   * Orders covered by MiFID 2 (Markets in Financial Instruments Directive 2) must include either [[mifid2DecisionMaker]] or [[mifid2DecisionAlgo]] field (but not both).
   *
   * Requires TWS 969+.
   */
  mifid2DecisionMaker?: string;

  /**
   * Identifies the algorithm responsible for investment decisions within the firm.
   * Orders covered under MiFID 2 must include either [[mifid2DecisionMaker]] or [[mifid2DecisionAlgo]], but cannot have both.
   *
   * Requires TWS 969+.
   */
  mifid2DecisionAlgo?: string;

  /**
   * For MiFID 2 reporting; identifies a person as the responsible party for the execution of a transaction within the firm.
   *
   * Requires TWS 969+.
   */
  mifid2ExecutionTrader?: string;

  /**
   * For MiFID 2 reporting; identifies the algorithm responsible for the execution of a transaction within the firm.
   *
   * Requires TWS 969+.
   */
  mifid2ExecutionAlgo?: string;

  /** Don't use auto price for hedge.  */
  dontUseAutoPriceForHedge?: boolean;

  /** TODO: document */

  autoCancelDate?: string;
  /** TODO: document */

  filledQuantity?: number;

  /** TODO: document */
  refFuturesConId?: number;

  /** TODO: document */
  autoCancelParent?: boolean;

  /** TODO: document */
  shareholder?: string;

  /** TODO: document */
  imbalanceOnly?: boolean;

  /** TODO: document */
  routeMarketableToBbo?: boolean;

  /** TODO: document */
  parentPermId?: number;

  /** TODO: document */
  randomizeSize?: boolean;

  /** TODO: document */
  randomizePrice?: boolean;

  /** Pegged-to-benchmark orders: this attribute will contain the conId of the contract against which the order will be pegged. */
  referenceContractId?: number;

  /** Pegged-to-benchmark orders: indicates whether the order's pegged price should increase or decreases. */
  isPeggedChangeAmountDecrease?: boolean;

  /** Pegged-to-benchmark orders: amount by which the order's pegged price should move. */
  peggedChangeAmount?: number;

  /** Pegged-to-benchmark orders: the amount the reference contract needs to move to adjust the pegged order. */
  referenceChangeAmount?: number;

  /** Pegged-to-benchmark orders: the exchange against which we want to observe the reference contract. */
  referenceExchangeId?: string;

  /** Adjusted Stop orders: the parent order will be adjusted to the given type when the adjusted trigger price is penetrated. */
  adjustedOrderType?: string;

  /** TODO: document */
  triggerPrice?: number;

  /** TODO: document */
  lmtPriceOffset?: number;

  /** Adjusted Stop orders: specifies the stop price of the adjusted (STP) parent. */
  adjustedStopPrice?: number;

  /** Adjusted Stop orders: specifies the stop limit price of the adjusted (STPL LMT) parent. */
  adjustedStopLimitPrice?: number;

  /** Adjusted Stop orders: specifies the trailing amount of the adjusted (TRAIL) parent. */
  adjustedTrailingAmount?: number;

  /** Adjusted Stop orders: specifies where the trailing unit is an amount (set to 0) or a percentage (set to 1) */
  adjustableTrailingUnit?: number;

  /** Conditions determining when the order will be activated or canceled. */
  conditions?: OrderCondition[];

  /** Indicates whether or not conditions will also be valid outside Regular Trading Hours. */
  conditionsIgnoreRth?: boolean;

  /** Conditions can determine if an order should become active or canceled. */
  conditionsCancelOrder?: boolean;

  /** Define the Soft Dollar Tier used for the order. Only provided for registered professional advisors and hedge and mutual funds. */
  tier?: SoftDollarTier;

  /** Set to `true` to create tickets from API orders when TWS is used as an OMS. */
  isOmsContainer?: boolean;

  /** Set to `true` to convert order of type 'Primary Peg' to 'D-Peg'. */
  discretionaryUpToLimitPrice?: boolean;

  /** TODO: document */
  usePriceMgmtAlgo?: boolean;
}
