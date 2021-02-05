import { Contract, SecType } from "../api/contract/contract";
import {
  FADataType,
  LogLevel,
  OptionExerciseAction,
  TagValue,
  MIN_SERVER_VER,
} from "../api/api";
import {
  ExecutionCondition,
  MarginCondition,
  Order,
  OrderConditionType,
  PercentChangeCondition,
  PriceCondition,
  TimeCondition,
  VolumeCondition,
} from "../api/order/order";
import { ExecutionFilter } from "../api/report/executionFilter";
import { TickByTickDataType } from "../api/market/tickType";
import { ScannerSubscription } from "../api/market/scannerSubscription";
import { OrderType } from "../api/order/orderType";
import { ErrorCode } from "../api/errorCode";

/**
 * @internal
 *
 * Outgoing message IDs.
 */
export enum OUT_MSG_ID {
  REQ_MKT_DATA = 1,
  CANCEL_MKT_DATA = 2,
  PLACE_ORDER = 3,
  CANCEL_ORDER = 4,
  REQ_OPEN_ORDERS = 5,
  REQ_ACCOUNT_DATA = 6,
  REQ_EXECUTIONS = 7,
  REQ_IDS = 8,
  REQ_CONTRACT_DATA = 9,
  REQ_MKT_DEPTH = 10,
  CANCEL_MKT_DEPTH = 11,
  REQ_NEWS_BULLETINS = 12,
  CANCEL_NEWS_BULLETINS = 13,
  SET_SERVER_LOGLEVEL = 14,
  REQ_AUTO_OPEN_ORDERS = 15,
  REQ_ALL_OPEN_ORDERS = 16,
  REQ_MANAGED_ACCTS = 17,
  REQ_FA = 18,
  REPLACE_FA = 19,
  REQ_HISTORICAL_DATA = 20,
  EXERCISE_OPTIONS = 21,
  REQ_SCANNER_SUBSCRIPTION = 22,
  CANCEL_SCANNER_SUBSCRIPTION = 23,
  REQ_SCANNER_PARAMETERS = 24,
  CANCEL_HISTORICAL_DATA = 25,
  REQ_CURRENT_TIME = 49,
  REQ_REAL_TIME_BARS = 50,
  CANCEL_REAL_TIME_BARS = 51,
  REQ_FUNDAMENTAL_DATA = 52,
  CANCEL_FUNDAMENTAL_DATA = 53,
  REQ_CALC_IMPLIED_VOLAT = 54,
  REQ_CALC_OPTION_PRICE = 55,
  CANCEL_CALC_IMPLIED_VOLAT = 56,
  CANCEL_CALC_OPTION_PRICE = 57,
  REQ_GLOBAL_CANCEL = 58,
  REQ_MARKET_DATA_TYPE = 59,
  REQ_POSITIONS = 61,
  REQ_ACCOUNT_SUMMARY = 62,
  CANCEL_ACCOUNT_SUMMARY = 63,
  CANCEL_POSITIONS = 64,
  VERIFY_REQUEST = 65, // not implemented
  VERIFY_MESSAGE = 66, // not implemented
  QUERY_DISPLAY_GROUPS = 67,
  SUBSCRIBE_TO_GROUP_EVENTS = 68,
  UPDATE_DISPLAY_GROUP = 69,
  UNSUBSCRIBE_FROM_GROUP_EVENTS = 70,
  START_API = 71, // sent by [[Socket]]
  VERIFY_AND_AUTH_REQUEST = 72, // not implemented
  VERIFY_AND_AUTH_MESSAGE = 73, // not implemented
  REQ_POSITIONS_MULTI = 74,
  CANCEL_POSITIONS_MULTI = 75,
  REQ_ACCOUNT_UPDATES_MULTI = 76,
  CANCEL_ACCOUNT_UPDATES_MULTI = 77,
  REQ_SEC_DEF_OPT_PARAMS = 78,
  REQ_SOFT_DOLLAR_TIERS = 79,
  REQ_FAMILY_CODES = 80,
  REQ_MATCHING_SYMBOLS = 81,
  REQ_MKT_DEPTH_EXCHANGES = 82,
  REQ_SMART_COMPONENTS = 83,
  REQ_NEWS_ARTICLE = 84,
  REQ_NEWS_PROVIDERS = 85,
  REQ_HISTORICAL_NEWS = 86,
  REQ_HEAD_TIMESTAMP = 87,
  REQ_HISTOGRAM_DATA = 88,
  CANCEL_HISTOGRAM_DATA = 89,
  CANCEL_HEAD_TIMESTAMP = 90,
  REQ_MARKET_RULE = 91,
  REQ_PNL = 92,
  CANCEL_PNL = 93,
  REQ_PNL_SINGLE = 94,
  CANCEL_PNL_SINGLE = 95,
  REQ_HISTORICAL_TICKS = 96,
  REQ_TICK_BY_TICK_DATA = 97,
  CANCEL_TICK_BY_TICK_DATA = 98,

  REQ_COMPLETED_ORDERS = 99,
}

/**
 * @@internal
 *
 * Helper function to nullify a number of Number.MAX_VALUE
 */
function nullifyMax(number): number | null {
  if (number === Number.MAX_VALUE) {
    return null;
  } else {
    return number;
  }
}

/**
 * @internal
 *
 * Callback interface of the [[Encoder]].
 */
export interface EncoderCallbacks {
  /** Get the IB API server version. */
  readonly serverVersion: number;

  /**
   * Send a message to the server connection.
   *
   * @param args Array of tokens to send.
   * Can contain nested arrays.
   */
  sendMsg(...tokens: unknown[]): void;

  /**
   * Emit an error event to public API interface.
   *
   * @param errMsg The error test message.
   * @param data Additional error data (optional).
   */
  emitError(errMsg: string, code: number, reqId: number): void;
}

/**
 * @internal
 *
 * Class for encoding messages and sending raw token data back to
 */
export class Encoder {
  /**
   * Create an [[Encoder]] object for encoding messages to token data.
   *
   * @param callback A [[EncoderCallbacks]] implementation.
   */
  constructor(private callback: EncoderCallbacks) {}

  /** Get the API server version. */
  private get serverVersion(): number {
    return this.callback.serverVersion;
  }

  /**
   * Send a message to the server connection.
   *
   * @param args Array of tokens to send.
   */
  private sendMsg(...args: unknown[]): void {
    this.callback.sendMsg(args);
  }

  /**
   * Emit an error event to public API interface.
   *
   * @param errMsg The error test message.
   * @param data Additional error data (optional).
   */
  private emitError(errMsg: string, code: ErrorCode, reqId: number): void {
    this.callback.emitError(
      `Server Version ${this.serverVersion}: ${errMsg}`,
      code,
      reqId
    );
  }

  /**
   * Encode a [[Contract]] to an array of tokens.
   */
  private encodeContract(contract: Contract): unknown[] {
    return [
      contract.conId,
      contract.symbol,
      contract.secType as string,
      contract.lastTradeDateOrContractMonth,
      contract.strike,
      contract.right,
      contract.multiplier,
      contract.exchange,
      contract.currency,
      contract.localSymbol,
      contract.tradingClass,
      contract.primaryExch,
      contract.secIdType,
      contract.secId,
    ];
  }

  /**
   * Encode a [[TagValue]] array to a string token.
   */
  private encodeTagValues(tagValues: TagValue[] | undefined): string {
    let result = "";
    tagValues?.forEach((tv) => {
      result += `${tv.tag}=${tv.value};`;
    });
    return result;
  }

  /**
   * @@internal
   *
   * Helper function convert an array of [[TagValue]] to a flat [tag,value] tuple array.
   */
  /*
function tagValuesToTokens(tagValues: TagValue[]): unknown[] {
  const result: unknown[] = new Array(tagValues.length * 2);
  let pos = 0;
  for (let i = 0; i < tagValues.length; i++) {
    result[pos++] = tagValues[i].tag;
    result[pos++] = tagValues[i].tag;
  }
  return result;
}*/

  /**
   * Encode a calculateImpliedVolatility message to an array of tokens.
   */
  calculateImpliedVolatility(
    reqId: number,
    contract: Contract,
    optionPrice: number,
    underPrice: number,
    //reserved for future use, must be blank
    impliedVolatilityOptions?: TagValue[]
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_CALC_IMPLIED_VOLAT) {
      return this.emitError(
        "It does not support calculate implied volatility requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (contract.tradingClass === undefined || contract.tradingClass === "") {
        return this.emitError(
          "It does not support tradingClass parameter in calculateImpliedVolatility.",
          ErrorCode.UPDATE_TWS,
          reqId
        );
      }
    }

    const version = 2;

    const tokens: unknown[] = [
      OUT_MSG_ID.REQ_CALC_IMPLIED_VOLAT,
      version,
      reqId,
    ];

    // send contract fields
    tokens.push(contract.conId);
    tokens.push(contract.symbol);
    tokens.push(contract.secType);
    tokens.push(contract.lastTradeDateOrContractMonth);
    tokens.push(contract.strike);
    tokens.push(contract.right);
    tokens.push(contract.multiplier);
    tokens.push(contract.exchange);
    tokens.push(contract.primaryExch);
    tokens.push(contract.currency);
    tokens.push(contract.localSymbol);

    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.tradingClass);
    }

    tokens.push(optionPrice);
    tokens.push(underPrice);

    if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      tokens.push(this.encodeTagValues(impliedVolatilityOptions));
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a calculateOptionPrice message to an array of tokens.
   */
  calculateOptionPrice(
    reqId: number,
    contract: Contract,
    volatility: number,
    underPrice: number,
    //reserved for future use, must be blank
    optionPriceOptions?: TagValue[]
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_CALC_OPTION_PRICE) {
      return this.emitError(
        "It does not support calculate option price requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (!!contract.tradingClass) {
        return this.emitError(
          "It does not support tradingClass parameter in calculateOptionPrice.",
          ErrorCode.UPDATE_TWS,
          reqId
        );
      }
    }

    const version = 2;

    const tokens: unknown[] = [
      OUT_MSG_ID.REQ_CALC_OPTION_PRICE,
      version,
      reqId,
    ];

    // send contract fields
    tokens.push(contract.conId);
    tokens.push(contract.symbol);
    tokens.push(contract.secType);
    tokens.push(contract.lastTradeDateOrContractMonth);
    tokens.push(contract.strike);
    tokens.push(contract.right);
    tokens.push(contract.multiplier);
    tokens.push(contract.exchange);
    tokens.push(contract.primaryExch);
    tokens.push(contract.currency);
    tokens.push(contract.localSymbol);

    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.tradingClass);
    }

    tokens.push(volatility);
    tokens.push(underPrice);

    if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      tokens.push(this.encodeTagValues(optionPriceOptions));
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a CANCEL_ACCOUNT_SUMMARY message to an array of tokens.
   */
  cancelAccountSummary(reqId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.ACCT_SUMMARY) {
      return this.emitError(
        "It not support account summary cancellation.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_ACCOUNT_SUMMARY, version, reqId);
  }

  /**
   * Encode a CANCEL_ACCOUNT_UPDATES_MULTI message to an array of tokens.
   */
  cancelAccountUpdatesMulti(reqId: number): void {
    const version = 2;

    this.sendMsg(OUT_MSG_ID.CANCEL_ACCOUNT_UPDATES_MULTI, version, reqId);
  }

  /**
   * Encode a CANCEL_CALC_IMPLIED_VOLAT message to an array of tokens.
   */
  cancelCalculateImpliedVolatility(reqId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.CANCEL_CALC_IMPLIED_VOLAT) {
      return this.emitError(
        "It does not support calculate implied volatility cancellation.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_CALC_IMPLIED_VOLAT, version, reqId);
  }

  /**
   * Encode a CANCEL_CALC_OPTION_PRICE message to an array of tokens.
   */
  cancelCalculateOptionPrice(reqId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.CANCEL_CALC_OPTION_PRICE) {
      return this.emitError(
        "It does not support calculate option price cancellation.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_CALC_OPTION_PRICE, version, reqId);
  }

  /**
   * Encode a CANCEL_FUNDAMENTAL_DATA message to an array of tokens.
   */
  cancelFundamentalData(reqId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.FUNDAMENTAL_DATA) {
      return this.emitError(
        "It does not support fundamental data requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_FUNDAMENTAL_DATA, version, reqId);
  }

  /**
   * Encode a CANCEL_HISTORICAL_DATA message to an array of tokens.
   */
  cancelHistoricalData(tickerId: number): void {
    if (this.serverVersion < 24) {
      return this.emitError(
        "It does not support historical data query cancellation.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_HISTORICAL_DATA, version, tickerId);
  }

  /**
   * Encode a CANCEL_MKT_DATA message to an array of tokens.
   */
  cancelMktData(tickerId: number): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_MKT_DATA, version, tickerId);
  }

  /**
   * Encode a CANCEL_MKT_DEPTH message to an array of tokens.
   */
  cancelMktDepth(tickerId: number, isSmartDepth: boolean): void {
    if (this.serverVersion < 6) {
      return this.emitError(
        "This feature is only available for versions of TWS >=6.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.SMART_DEPTH && isSmartDepth) {
      return this.emitError(
        "It does not support SMART depth cancel.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    const version = 1;

    const tokens: unknown[] = [OUT_MSG_ID.CANCEL_MKT_DEPTH, version, tickerId];

    if (this.serverVersion >= MIN_SERVER_VER.SMART_DEPTH) {
      tokens.push(isSmartDepth);
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a CANCEL_NEWS_BULLETINS message to an array of tokens.
   */
  cancelNewsBulletins(): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_NEWS_BULLETINS, version);
  }

  /**
   * Encode a CANCEL_ORDER message to an array of tokens.
   */
  cancelOrder(id: number): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_ORDER, version, id);
  }

  /**
   * Encode a CANCEL_POSITIONS message to an array of tokens.
   */
  cancelPositions(): void {
    if (this.serverVersion < MIN_SERVER_VER.ACCT_SUMMARY) {
      return this.emitError(
        "It does not support position cancellation.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_POSITIONS, version);
  }

  /**
   * Encode a CANCEL_REAL_TIME_BARS message to an array of tokens.
   */
  cancelRealTimeBars(tickerId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.REAL_TIME_BARS) {
      return this.emitError(
        "It does not support realtime bar data query cancellation.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_REAL_TIME_BARS, version, tickerId);
  }

  /**
   * Encode a CANCEL_SCANNER_SUBSCRIPTION message to an array of tokens.
   */
  cancelScannerSubscription(tickerId: number): void {
    if (this.serverVersion < 24) {
      return this.emitError(
        "It does not support API scanner subscription.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.CANCEL_SCANNER_SUBSCRIPTION, version, tickerId);
  }

  /**
   * Encode a EXERCISE_OPTIONS message to an array of tokens.
   */
  exerciseOptions(
    tickerId: number,
    contract: Contract,
    exerciseAction: OptionExerciseAction,
    exerciseQuantity: number,
    account: string,
    override: number
  ): void {
    const version = 2;

    if (this.serverVersion < 21) {
      return this.emitError(
        "It does not support options exercise from the API.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (!!contract.tradingClass || contract.conId != undefined) {
        return this.emitError(
          "It does not support conId and tradingClass parameters in exerciseOptions.",
          ErrorCode.UPDATE_TWS,
          tickerId
        );
      }
    }

    const tokens: unknown[] = [OUT_MSG_ID.EXERCISE_OPTIONS, version, tickerId];

    // send contract fields
    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.conId);
    }

    tokens.push(contract.symbol);
    tokens.push(contract.secType);
    tokens.push(contract.lastTradeDateOrContractMonth);
    tokens.push(contract.strike);
    tokens.push(contract.right);
    tokens.push(contract.multiplier);
    tokens.push(contract.exchange);
    tokens.push(contract.currency);
    tokens.push(contract.localSymbol);

    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.tradingClass);
    }

    tokens.push(exerciseAction);
    tokens.push(exerciseQuantity);
    tokens.push(account);
    tokens.push(override);

    this.sendMsg(tokens);
  }

  /**
   * Encode a PLACE_ORDER message to an array of tokens.
   */
  placeOrder(id: number, contract: Contract, order: Order): void {
    if (this.serverVersion < MIN_SERVER_VER.SCALE_ORDERS) {
      if (
        order.scaleInitLevelSize !== undefined ||
        order.scalePriceIncrement !== undefined
      ) {
        return this.emitError(
          "It does not support Scale orders.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.SSHORT_COMBO_LEGS) {
      contract.comboLegs?.forEach((comboLeg) => {
        if (comboLeg.shortSaleSlot || !!comboLeg.designatedLocation) {
          return this.emitError(
            "It does not support SSHORT flag for combo legs.",
            ErrorCode.UPDATE_TWS,
            id
          );
        }
      });
    }

    if (this.serverVersion < MIN_SERVER_VER.WHAT_IF_ORDERS) {
      if (order.whatIf) {
        return this.emitError(
          "It does not support what-if orders.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.DELTA_NEUTRAL) {
      if (contract.deltaNeutralContract) {
        return this.emitError(
          "It does not support delta-neutral orders.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.SCALE_ORDERS2) {
      if (order.scaleSubsLevelSize !== undefined) {
        return this.emitError(
          "It does not support Subsequent Level Size for Scale orders.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.ALGO_ORDERS) {
      if (!!order.algoStrategy) {
        return this.emitError(
          "It does not support algo orders.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.NOT_HELD) {
      if (order.notHeld) {
        return this.emitError(
          "It does not support notHeld parameter.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.SEC_ID_TYPE) {
      if (!!contract.secIdType || !!contract.secId) {
        return this.emitError(
          "It does not support secIdType and secId parameters.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.PLACE_ORDER_CONID) {
      if (contract.conId != undefined) {
        return this.emitError(
          "It does not support conId parameter.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.SSHORTX) {
      if (order.exemptCode !== -1) {
        return this.emitError(
          "It does not support exemptCode parameter.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.SSHORTX) {
      contract.comboLegs?.forEach((comboLeg) => {
        if (comboLeg.exemptCode !== -1) {
          return this.emitError(
            "It does not support exemptCode parameter.",
            ErrorCode.UPDATE_TWS,
            id
          );
        }
      });
    }

    if (this.serverVersion < MIN_SERVER_VER.HEDGE_ORDERS) {
      if (!!order.hedgeType) {
        return this.emitError(
          "It does not support hedge orders.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.OPT_OUT_SMART_ROUTING) {
      if (order.optOutSmartRouting) {
        return this.emitError(
          "It does not support optOutSmartRouting parameter.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.DELTA_NEUTRAL_CONID) {
      if (
        order.deltaNeutralConId != undefined ||
        !!order.deltaNeutralSettlingFirm ||
        !!order.deltaNeutralClearingAccount ||
        !!order.deltaNeutralClearingIntent
      ) {
        return this.emitError(
          "It does not support deltaNeutral parameters: ConId, SettlingFirm, ClearingAccount, ClearingIntent.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.DELTA_NEUTRAL_OPEN_CLOSE) {
      if (
        !!order.deltaNeutralOpenClose ||
        order.deltaNeutralShortSale ||
        order.deltaNeutralShortSaleSlot != undefined ||
        !!order.deltaNeutralDesignatedLocation
      ) {
        return this.emitError(
          "It does not support deltaNeutral parameters: OpenClose, ShortSale, ShortSaleSlot, DesignatedLocation.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.SCALE_ORDERS3) {
      if (
        order.scalePriceIncrement != undefined &&
        order.scalePriceIncrement !== undefined
      ) {
        if (
          order.scalePriceAdjustValue !== undefined ||
          order.scalePriceAdjustInterval !== undefined ||
          order.scaleProfitOffset !== undefined ||
          order.scaleAutoReset ||
          order.scaleInitPosition !== undefined ||
          order.scaleInitFillQty !== undefined ||
          order.scaleRandomPercent
        ) {
          return this.emitError(
            "It does not support Scale order parameters: PriceAdjustValue, PriceAdjustInterval, ProfitOffset, AutoReset, InitPosition, InitFillQty and RandomPercent",
            ErrorCode.UPDATE_TWS,
            id
          );
        }
      }
    }

    if (
      this.serverVersion < MIN_SERVER_VER.ORDER_COMBO_LEGS_PRICE &&
      SecType.BAG === contract.secType?.toUpperCase()
    ) {
      order.orderComboLegs?.forEach((orderComboLeg) => {
        if (orderComboLeg.price !== undefined) {
          return this.emitError(
            "It does not support per-leg prices for order combo legs.",
            ErrorCode.UPDATE_TWS,
            id
          );
        }
      });
    }

    if (this.serverVersion < MIN_SERVER_VER.TRAILING_PERCENT) {
      if (order.trailingPercent !== undefined) {
        return this.emitError(
          "It does not support trailing percent parameter.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (!!contract.tradingClass) {
        return this.emitError(
          "It does not support tradingClass parameters in placeOrder.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.SCALE_TABLE) {
      if (
        !!order.scaleTable ||
        !!order.activeStartTime ||
        !!order.activeStopTime
      ) {
        return this.emitError(
          "It does not support scaleTable, activeStartTime and activeStopTime parameters.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.ALGO_ID && !!order.algoId) {
      return this.emitError(
        "It does not support algoId parameter",
        ErrorCode.UPDATE_TWS,
        id
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.SCALE_TABLE) {
      if (
        !!order.scaleTable ||
        order.activeStartTime?.length ||
        order.activeStopTime?.length
      ) {
        return this.emitError(
          "It does not support scaleTable, activeStartTime and activeStopTime parameters.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.ORDER_SOLICITED) {
      if (order.solicited) {
        return this.emitError(
          "It does not support order solicited parameter.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.MODELS_SUPPORT) {
      if (!!order.modelCode) {
        return this.emitError(
          "It does not support model code parameter.",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (
      this.serverVersion < MIN_SERVER_VER.EXT_OPERATOR &&
      !!order.extOperator
    ) {
      return this.emitError(
        "It does not support ext operator",
        ErrorCode.UPDATE_TWS,
        id
      );
    }

    if (
      this.serverVersion < MIN_SERVER_VER.SOFT_DOLLAR_TIER &&
      (!!order.softDollarTier?.name || !!order.softDollarTier?.value)
    ) {
      return this.emitError(
        "It does not support soft dollar tier",
        ErrorCode.UPDATE_TWS,
        id
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.CASH_QTY) {
      if (order.cashQty !== undefined && order.cashQty != Number.MAX_VALUE) {
        return this.emitError(
          "It does not support cash quantity parameter",
          ErrorCode.UPDATE_TWS,
          id
        );
      }
    }

    if (
      this.serverVersion < MIN_SERVER_VER.DECISION_MAKER &&
      (!!order.mifid2DecisionMaker || !!order.mifid2DecisionAlgo)
    ) {
      return this.emitError(
        "It does not support MIFID II decision maker parameters",
        ErrorCode.UPDATE_TWS,
        id
      );
    }

    if (
      this.serverVersion < MIN_SERVER_VER.MIFID_EXECUTION &&
      (!!order.mifid2ExecutionTrader || !!order.mifid2ExecutionAlgo)
    ) {
      return this.emitError(
        "It does not support MIFID II execution parameters",
        ErrorCode.UPDATE_TWS,
        id
      );
    }

    if (
      this.serverVersion < MIN_SERVER_VER.AUTO_PRICE_FOR_HEDGE &&
      order.dontUseAutoPriceForHedge
    ) {
      return this.emitError(
        "It does not support don't use auto price for hedge parameter.",
        ErrorCode.UPDATE_TWS,
        id
      );
    }

    if (
      this.serverVersion < MIN_SERVER_VER.ORDER_CONTAINER &&
      order.isOmsContainer
    ) {
      return this.emitError(
        "It does not support oms container parameter.",
        ErrorCode.UPDATE_TWS,
        id
      );
    }

    if (
      this.serverVersion < MIN_SERVER_VER.D_PEG_ORDERS &&
      order.discretionaryUpToLimitPrice
    ) {
      return this.emitError(
        "It does not support D-Peg orders.",
        ErrorCode.UPDATE_TWS,
        id
      );
    }

    if (
      this.serverVersion < MIN_SERVER_VER.PRICE_MGMT_ALGO &&
      order.usePriceMgmtAlgo != null
    ) {
      return this.emitError(
        "It does not support price management algo parameter",
        ErrorCode.UPDATE_TWS,
        id
      );
    }

    const version = this.serverVersion < MIN_SERVER_VER.NOT_HELD ? 27 : 45;

    // send place order msg
    const tokens: unknown[] = [OUT_MSG_ID.PLACE_ORDER];
    if (this.serverVersion < MIN_SERVER_VER.ORDER_CONTAINER) {
      tokens.push(version);
    }
    tokens.push(id);

    // send contract fields
    if (this.serverVersion >= MIN_SERVER_VER.PLACE_ORDER_CONID) {
      tokens.push(contract.conId);
    }
    tokens.push(contract.symbol);
    tokens.push(contract.secType);
    tokens.push(contract.lastTradeDateOrContractMonth);
    tokens.push(contract.strike);
    tokens.push(contract.right);
    if (this.serverVersion >= 15) {
      tokens.push(contract.multiplier);
    }
    tokens.push(contract.exchange);
    if (this.serverVersion >= 14) {
      tokens.push(contract.primaryExch);
    }
    tokens.push(contract.currency);
    if (this.serverVersion >= 2) {
      tokens.push(contract.localSymbol);
    }
    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.tradingClass);
    }
    if (this.serverVersion >= MIN_SERVER_VER.SEC_ID_TYPE) {
      tokens.push(contract.secIdType);
      tokens.push(contract.secId);
    }

    // send main order fields
    tokens.push(order.action);

    if (this.serverVersion >= MIN_SERVER_VER.FRACTIONAL_POSITIONS) {
      tokens.push(order.totalQuantity);
    } else {
      tokens.push(
        order.totalQuantity ? Math.round(order.totalQuantity) : undefined
      );
    }

    tokens.push(order.orderType);
    if (this.serverVersion < MIN_SERVER_VER.ORDER_COMBO_LEGS_PRICE) {
      tokens.push(order.lmtPrice ?? 0);
    } else {
      tokens.push(nullifyMax(order.lmtPrice));
    }
    if (this.serverVersion < MIN_SERVER_VER.TRAILING_PERCENT) {
      tokens.push(order.auxPrice ?? 0);
    } else {
      tokens.push(nullifyMax(order.auxPrice));
    }

    // send extended order fields
    tokens.push(order.tif);
    tokens.push(order.ocaGroup);
    tokens.push(order.account);
    tokens.push(order.openClose);
    tokens.push(order.origin);
    tokens.push(order.orderRef);
    tokens.push(order.transmit);
    if (this.serverVersion >= 4) {
      tokens.push(order.parentId);
    }

    if (this.serverVersion >= 5) {
      tokens.push(order.blockOrder);
      tokens.push(order.sweepToFill);
      tokens.push(order.displaySize);
      tokens.push(order.triggerMethod);
      if (this.serverVersion < 38) {
        // will never happen
        tokens.push(/* order.ignoreRth */ false);
      } else {
        tokens.push(order.outsideRth);
      }
    }

    if (this.serverVersion >= 7) {
      tokens.push(order.hidden);
    }

    // Send combo legs for BAG requests
    if (
      this.serverVersion >= 8 &&
      SecType.BAG === contract.secType?.toUpperCase()
    ) {
      if (!contract.comboLegs?.length) {
        tokens.push(0);
      } else {
        tokens.push(contract.comboLegs.length);
        contract.comboLegs.forEach((comboLeg) => {
          tokens.push(comboLeg.conId);
          tokens.push(comboLeg.ratio);
          tokens.push(comboLeg.action);
          tokens.push(comboLeg.exchange);
          tokens.push(comboLeg.openClose);

          if (this.serverVersion >= MIN_SERVER_VER.SSHORT_COMBO_LEGS) {
            tokens.push(comboLeg.shortSaleSlot);
            tokens.push(comboLeg.designatedLocation);
          }
          if (this.serverVersion >= MIN_SERVER_VER.SSHORTX_OLD) {
            tokens.push(comboLeg.exemptCode);
          }
        });
      }
    }

    // Send order combo legs for BAG requests
    if (
      this.serverVersion >= MIN_SERVER_VER.ORDER_COMBO_LEGS_PRICE &&
      SecType.BAG === contract.secType?.toUpperCase()
    ) {
      if (!order.orderComboLegs?.length) {
        tokens.push(0);
      } else {
        tokens.push(order.orderComboLegs.length);
        order.orderComboLegs.forEach(function (orderComboLeg) {
          tokens.push(nullifyMax(orderComboLeg.price));
        });
      }
    }

    if (
      this.serverVersion >= MIN_SERVER_VER.SMART_COMBO_ROUTING_PARAMS &&
      SecType.BAG === contract.secType?.toUpperCase()
    ) {
      const smartComboRoutingParamsCount = !order.smartComboRoutingParams
        ? 0
        : order.smartComboRoutingParams.length;
      tokens.push(smartComboRoutingParamsCount);
      if (smartComboRoutingParamsCount > 0) {
        order.smartComboRoutingParams?.forEach((param) => {
          tokens.push(param.tag);
          tokens.push(param.value);
        });
      }
    }

    if (this.serverVersion >= 9) {
      // send deprecated sharesAllocation field
      tokens.push("");
    }

    if (this.serverVersion >= 10) {
      tokens.push(order.discretionaryAmt);
    }

    if (this.serverVersion >= 11) {
      tokens.push(order.goodAfterTime);
    }

    if (this.serverVersion >= 12) {
      tokens.push(order.goodTillDate);
    }

    if (this.serverVersion >= 13) {
      tokens.push(order.faGroup);
      tokens.push(order.faMethod);
      tokens.push(order.faPercentage);
      tokens.push(order.faProfile);
    }

    if (this.serverVersion >=MIN_SERVER_VER.MODELS_SUPPORT) {
      tokens.push(order.modelCode);
    }

    if (this.serverVersion >= 18) {
      // institutional short sale slot fields.
      tokens.push(order.shortSaleSlot); // 0 only for retail, 1 or 2 only for institution.
      tokens.push(order.designatedLocation); // only populate when order.shortSaleSlot = 2.
    }
    if (this.serverVersion >= MIN_SERVER_VER.SSHORTX_OLD) {
      tokens.push(order.exemptCode);
    }
    if (this.serverVersion >= 19) {
      tokens.push(order.ocaType);

      if (this.serverVersion < 38) {
        // will never happen
        tokens.push(/* order.rthOnly */ false);
      }

      tokens.push(order.rule80A);
      tokens.push(order.settlingFirm);
      tokens.push(order.allOrNone);
      tokens.push(nullifyMax(order.minQty));
      tokens.push(nullifyMax(order.percentOffset));
      tokens.push(order.eTradeOnly);
      tokens.push(order.firmQuoteOnly);
      tokens.push(nullifyMax(order.nbboPriceCap));
      tokens.push(nullifyMax(order.auctionStrategy));
      tokens.push(nullifyMax(order.startingPrice));
      tokens.push(nullifyMax(order.stockRefPrice));
      tokens.push(nullifyMax(order.delta));

      // Volatility orders had specific watermark price attribs in server version 26
      const lower =
        this.serverVersion === 26 && order.orderType === "VOL"
          ? Number.MAX_VALUE
          : order.stockRangeLower;
      const upper =
        this.serverVersion === 26 && order.orderType === "VOL"
          ? Number.MAX_VALUE
          : order.stockRangeUpper;
      tokens.push(lower);
      tokens.push(upper);
    }

    if (this.serverVersion >= 22) {
      tokens.push(order.overridePercentageConstraints);
    }

    if (this.serverVersion >= 26) {
      // Volatility orders
      tokens.push(nullifyMax(order.volatility));
      tokens.push(nullifyMax(order.volatilityType));

      if (this.serverVersion < 28) {
        tokens.push(order.deltaNeutralOrderType?.toUpperCase() === "MKT");
      } else {
        tokens.push(order.deltaNeutralOrderType);
        tokens.push(nullifyMax(order.deltaNeutralAuxPrice));

        if (
          this.serverVersion >= MIN_SERVER_VER.DELTA_NEUTRAL_CONID &&
          !!order.deltaNeutralOrderType
        ) {
          tokens.push(order.deltaNeutralConId);
          tokens.push(order.deltaNeutralSettlingFirm);
          tokens.push(order.deltaNeutralClearingAccount);
          tokens.push(order.deltaNeutralClearingIntent);
        }

        if (
          this.serverVersion >= MIN_SERVER_VER.DELTA_NEUTRAL_OPEN_CLOSE &&
          !!order.deltaNeutralOrderType
        ) {
          tokens.push(order.deltaNeutralOpenClose);
          tokens.push(order.deltaNeutralShortSale);
          tokens.push(order.deltaNeutralShortSaleSlot);
          tokens.push(order.deltaNeutralDesignatedLocation);
        }
      }

      tokens.push(order.continuousUpdate);

      if (this.serverVersion === 26) {
        // Volatility orders had specific watermark price attribs in server version 26
        const lower =
          order.orderType === "VOL" ? order.stockRangeLower : Number.MAX_VALUE;
        const upper =
          order.orderType === "VOL" ? order.stockRangeUpper : Number.MAX_VALUE;
        tokens.push(nullifyMax(lower));
        tokens.push(nullifyMax(upper));
      }

      tokens.push(nullifyMax(order.referencePriceType));
    }

    if (this.serverVersion >= 30) {
      // TRAIL_STOP_LIMIT stop price
      tokens.push(nullifyMax(order.trailStopPrice));
    }

    if (this.serverVersion >= MIN_SERVER_VER.TRAILING_PERCENT) {
      tokens.push(nullifyMax(order.trailingPercent));
    }

    if (this.serverVersion >= MIN_SERVER_VER.SCALE_ORDERS) {
      if (this.serverVersion >= MIN_SERVER_VER.SCALE_ORDERS2) {
        tokens.push(nullifyMax(order.scaleInitLevelSize));
        tokens.push(nullifyMax(order.scaleSubsLevelSize));
      } else {
        tokens.push("");
        tokens.push(nullifyMax(order.scaleInitLevelSize));
      }
      tokens.push(nullifyMax(order.scalePriceIncrement));
    }

    if (
      this.serverVersion >= MIN_SERVER_VER.SCALE_ORDERS3 &&
      order.scalePriceIncrement != null &&
      order.scalePriceIncrement !== Number.MAX_VALUE
    ) {
      tokens.push(nullifyMax(order.scalePriceAdjustValue));
      tokens.push(nullifyMax(order.scalePriceAdjustInterval));
      tokens.push(nullifyMax(order.scaleProfitOffset));
      tokens.push(order.scaleAutoReset);
      tokens.push(nullifyMax(order.scaleInitPosition));
      tokens.push(nullifyMax(order.scaleInitFillQty));
      tokens.push(order.scaleRandomPercent);
    }

    if (this.serverVersion >= MIN_SERVER_VER.SCALE_TABLE) {
      tokens.push(order.scaleTable);
      tokens.push(order.activeStartTime);
      tokens.push(order.activeStopTime);
    }

    if (this.serverVersion >= MIN_SERVER_VER.HEDGE_ORDERS) {
      tokens.push(order.hedgeType);
      if (!!order.hedgeType) {
        tokens.push(order.hedgeParam);
      }
    }

    if (this.serverVersion >= MIN_SERVER_VER.OPT_OUT_SMART_ROUTING) {
      tokens.push(order.optOutSmartRouting);
    }

    if (this.serverVersion >= MIN_SERVER_VER.PTA_ORDERS) {
      tokens.push(order.clearingAccount);
      tokens.push(order.clearingIntent);
    }

    if (this.serverVersion >= MIN_SERVER_VER.NOT_HELD) {
      tokens.push(order.notHeld);
    }

    if (this.serverVersion >= MIN_SERVER_VER.DELTA_NEUTRAL) {
      if (contract.deltaNeutralContract) {
        tokens.push(true);
        tokens.push(contract.deltaNeutralContract.conId);
        tokens.push(contract.deltaNeutralContract.delta);
        tokens.push(contract.deltaNeutralContract.price);
      } else {
        tokens.push(false);
      }
    }

    if (this.serverVersion >= MIN_SERVER_VER.ALGO_ORDERS) {
      tokens.push(order.algoStrategy);
      if (!!order.algoStrategy) {
        const algoParamsCount = order.algoParams?.length
          ? order.algoParams.length
          : 0;
        tokens.push(algoParamsCount);
        if (algoParamsCount > 0) {
          order.algoParams?.forEach((param) => {
            tokens.push(param.tag);
            tokens.push(param.value);
          });
        }
      }
    }

    if (this.serverVersion >= MIN_SERVER_VER.ALGO_ID) {
      tokens.push(order.algoId);
    }

    if (this.serverVersion >= MIN_SERVER_VER.WHAT_IF_ORDERS) {
      tokens.push(order.whatIf);
    }

    // send orderMiscOptions parameter
    if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      tokens.push(order.orderMiscOptions);
    }

    if (this.serverVersion >= MIN_SERVER_VER.ORDER_SOLICITED) {
      tokens.push(order.solicited);
    }

    if (this.serverVersion >= MIN_SERVER_VER.RANDOMIZE_SIZE_AND_PRICE) {
      tokens.push(order.randomizeSize);
      tokens.push(order.randomizePrice);
    }

    if (this.serverVersion >= MIN_SERVER_VER.PEGGED_TO_BENCHMARK) {
      if (order.orderType == OrderType.PEG_BENCH) {
        tokens.push(order.referenceContractId);
        tokens.push(order.isPeggedChangeAmountDecrease);
        tokens.push(order.peggedChangeAmount);
        tokens.push(order.referenceChangeAmount);
        tokens.push(order.referenceExchangeId);
      }

      const nConditions = order.conditions ? order.conditions.length : 0;

      tokens.push(nConditions);
      if (nConditions > 0) {
        order.conditions?.forEach((cond) => {
          tokens.push(cond.conjunctionConnection);

          switch (cond.type) {
            case OrderConditionType.Execution: {
              const execCond = cond as ExecutionCondition;
              tokens.push(execCond.secType);
              tokens.push(execCond.exchange);
              tokens.push(execCond.symbol);
              break;
            }

            case OrderConditionType.Margin: {
              const marginCond = cond as MarginCondition;
              // OperatorCondition
              tokens.push(marginCond.isMore);
              tokens.push(marginCond.strValue);
              break;
            }

            case OrderConditionType.PercentChange: {
              const percentChangeCond = cond as PercentChangeCondition;
              // OperatorCondition
              tokens.push(percentChangeCond.isMore);
              tokens.push(percentChangeCond.strValue);
              // ContractCondition
              tokens.push(percentChangeCond.conId);
              tokens.push(percentChangeCond.exchange);
              break;
            }

            case OrderConditionType.Price: {
              const priceConditionCond = cond as PriceCondition;
              // OperatorCondition
              tokens.push(priceConditionCond.isMore);
              tokens.push(priceConditionCond.strValue);
              // ContractCondition
              tokens.push(priceConditionCond.conId);
              tokens.push(priceConditionCond.exchange);
              // PriceCondition
              tokens.push(priceConditionCond.triggerMethod);
              break;
            }

            case OrderConditionType.Time: {
              const timeConditionCond = cond as TimeCondition;
              // OperatorCondition
              tokens.push(timeConditionCond.isMore);
              tokens.push(timeConditionCond.strValue);
              break;
            }

            case OrderConditionType.Volume: {
              const timeConditionCond = cond as VolumeCondition;
              // OperatorCondition
              tokens.push(timeConditionCond.isMore);
              tokens.push(timeConditionCond.strValue);
              // ContractCondition
              tokens.push(timeConditionCond.conId);
              tokens.push(timeConditionCond.exchange);
              break;
            }
          }
        });

        tokens.push(order.conditionsIgnoreRth);
        tokens.push(order.conditionsCancelOrder);
      }

      tokens.push(order.adjustedOrderType);
      tokens.push(order.triggerPrice);
      tokens.push(order.lmtPriceOffset);
      tokens.push(order.adjustedStopPrice);
      tokens.push(order.adjustedStopLimitPrice);
      tokens.push(order.adjustedTrailingAmount);
      tokens.push(order.adjustableTrailingUnit);
    }

    if (this.serverVersion >= MIN_SERVER_VER.EXT_OPERATOR) {
      tokens.push(order.extOperator);
    }

    if (this.serverVersion >= MIN_SERVER_VER.SOFT_DOLLAR_TIER) {
      tokens.push(order.softDollarTier?.name ? order.softDollarTier.name : "");
      tokens.push(
        order.softDollarTier?.value ? order.softDollarTier.value : ""
      );
    }

    if (this.serverVersion >= MIN_SERVER_VER.CASH_QTY) {
      tokens.push(nullifyMax(order.cashQty));
    }

    if (this.serverVersion >= MIN_SERVER_VER.DECISION_MAKER) {
      tokens.push(order.mifid2DecisionMaker);
      tokens.push(order.mifid2DecisionAlgo);
    }

    if (this.serverVersion >= MIN_SERVER_VER.MIFID_EXECUTION) {
      tokens.push(order.mifid2ExecutionTrader);
      tokens.push(order.mifid2ExecutionAlgo);
    }

    if (this.serverVersion >= MIN_SERVER_VER.AUTO_PRICE_FOR_HEDGE) {
      tokens.push(order.dontUseAutoPriceForHedge);
    }

    if (this.serverVersion >= MIN_SERVER_VER.ORDER_CONTAINER) {
      tokens.push(order.isOmsContainer);
    }

    if (this.serverVersion >= MIN_SERVER_VER.D_PEG_ORDERS) {
      tokens.push(order.discretionaryUpToLimitPrice);
    }

    if (this.serverVersion >= MIN_SERVER_VER.PRICE_MGMT_ALGO) {
      tokens.push(order.usePriceMgmtAlgo);
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a REPLACE_FA message to an array of tokens.
   */
  replaceFA(faDataType: FADataType, xml: string): void {
    if (this.serverVersion < 13) {
      return this.emitError(
        "This feature is only available for versions of TWS >= 13.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.REPLACE_FA, version, faDataType, xml);
  }

  /**
   * Encode a REQ_ACCOUNT_SUMMARY message to an array of tokens.
   */
  reqAccountSummary(reqId: number, group: string, tags: string): void {
    if (this.serverVersion < MIN_SERVER_VER.ACCT_SUMMARY) {
      return this.emitError(
        "It does not support account summary requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_ACCOUNT_SUMMARY, version, reqId, group, tags);
  }

  /**
   * Encode a REQ_PNL message to an array of tokens.
   */
  reqPnL(reqId: number, account: string, modelCode: string | null): void {
    if (this.serverVersion < MIN_SERVER_VER.PNL) {
      return this.emitError(
        "It does not support pnl requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_PNL, reqId, account, modelCode);
  }

  /**
   * Encode a REQ_PNL message.
   */
  cancelPnL(reqId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.PNL) {
      return this.emitError(
        "It does not support pnl requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(OUT_MSG_ID.CANCEL_PNL, reqId);
  }

  /**
   * Encode a REQ_PNL_SINGLE message.
   */
  reqPnLSingle(
    reqId: number,
    account: string,
    modelCode: string | null,
    conId: number
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.PNL) {
      return this.emitError(
        "It does not support pnl requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_PNL_SINGLE, reqId, account, modelCode, conId);
  }

  /**
   * Encode a CANCEL_PNL_SINGLE message.
   */
  cancelPnLSingle(reqId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.PNL) {
      return this.emitError(
        "It does not support pnl requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(OUT_MSG_ID.CANCEL_PNL_SINGLE, reqId);
  }

  /**
   * Encode a REQ_ACCOUNT_DATA message.
   */
  reqAccountUpdates(subscribe: boolean, acctCode: string): void {
    const version = 2;

    const tokens: unknown[] = [OUT_MSG_ID.REQ_ACCOUNT_DATA, version, subscribe];

    // Send the account code. This will only be used for FA clients
    if (this.serverVersion >= 9) {
      tokens.push(acctCode);
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a REQ_ACCOUNT_UPDATES_MULTI message.
   */
  reqAccountUpdatesMulti(
    reqId: number,
    acctCode: string,
    modelCode: string,
    ledgerAndNLV: boolean
  ): void {
    const version = 2;

    this.sendMsg(
      OUT_MSG_ID.REQ_ACCOUNT_UPDATES_MULTI,
      version,
      reqId,
      acctCode,
      modelCode,
      ledgerAndNLV
    );
  }

  /**
   * Encode a REQ_ALL_OPEN_ORDERS message.
   */
  reqAllOpenOrders(): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_ALL_OPEN_ORDERS, version);
  }

  /**
   * Encode a REQ_AUTO_OPEN_ORDERS message.
   */
  reqAutoOpenOrders(bAutoBind: boolean): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_AUTO_OPEN_ORDERS, version, bAutoBind);
  }

  /**
   * Encode a REQ_HEAD_TIMESTAMP message.
   */
  reqHeadTimestamp(
    reqId: number,
    contract: Contract,
    whatToShow: string,
    useRTH: boolean,
    formatDate: number
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_HEAD_TIMESTAMP) {
      return this.emitError(
        "It does not support reqHeadTimeStamp",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(
      OUT_MSG_ID.REQ_HEAD_TIMESTAMP,
      reqId,
      this.encodeContract(contract),
      useRTH,
      whatToShow,
      formatDate
    );
  }

  /**
   * Encode a REQ_CONTRACT_DATA message.
   */
  reqContractDetails(reqId: number, contract: Contract): void {
    if (this.serverVersion < 4) {
      return this.emitError(
        "This feature is only available for versions of TWS >=4",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.SEC_ID_TYPE) {
      if (!!contract.secIdType || !!contract.secId) {
        return this.emitError(
          "It does not support secIdType and secId parameters.",
          ErrorCode.UPDATE_TWS,
          reqId
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (!!contract.tradingClass) {
        return this.emitError(
          "It does not support tradingClass parameter in reqContractDetails.",
          ErrorCode.UPDATE_TWS,
          reqId
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.LINKING) {
      if (!!contract.primaryExch) {
        return this.emitError(
          "It does not support primaryExchange parameter in reqContractDetails.",
          ErrorCode.UPDATE_TWS,
          reqId
        );
      }
    }

    const version = 8;

    // send req mkt data msg
    const args: unknown[] = [OUT_MSG_ID.REQ_CONTRACT_DATA, version];

    if (this.serverVersion >= MIN_SERVER_VER.CONTRACT_DATA_CHAIN) {
      args.push(reqId);
    }

    // send contract fields
    if (this.serverVersion >= MIN_SERVER_VER.CONTRACT_CONID) {
      args.push(contract.conId);
    }

    args.push(contract.symbol);
    args.push(contract.secType);
    args.push(contract.lastTradeDateOrContractMonth);
    args.push(contract.strike);
    args.push(contract.right);

    if (this.serverVersion >= 15) {
      args.push(contract.multiplier);
    }

    if (this.serverVersion >= MIN_SERVER_VER.PRIMARYEXCH) {
      args.push(contract.exchange);
      args.push(contract.primaryExch);
    } else if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      if (
        !!contract.primaryExch &&
        ("BEST" === contract.exchange || "SMART" === contract.exchange)
      ) {
        args.push(contract.exchange + ":" + contract.primaryExch);
      } else {
        args.push(contract.exchange);
      }
    }

    args.push(contract.currency);
    args.push(contract.localSymbol);

    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      args.push(contract.tradingClass);
    }

    if (this.serverVersion >= 31) {
      args.push(contract.includeExpired);
    }

    if (this.serverVersion >= MIN_SERVER_VER.SEC_ID_TYPE) {
      args.push(contract.secIdType);
      args.push(contract.secId);
    }

    this.sendMsg(args);
  }

  /**
   * Encode a REQ_CURRENT_TIME message.
   */
  reqCurrentTime(): void {
    if (this.serverVersion < 33) {
      return this.emitError(
        "It does not support current time requests.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_CURRENT_TIME, version);
  }

  /**
   * Encode a REQ_EXECUTIONS message.
   */
  reqExecutions(reqId: number, filter: ExecutionFilter): void {
    // NOTE: Time format must be 'yyyymmdd-hh:mm:ss' E.g. '20030702-14:55'

    const version = 3;

    // send req open orders msg
    const args: unknown[] = [OUT_MSG_ID.REQ_EXECUTIONS, version];

    if (this.serverVersion >= MIN_SERVER_VER.EXECUTION_DATA_CHAIN) {
      args.push(reqId);
    }

    // Send the execution rpt filter data
    if (this.serverVersion >= 9) {
      args.push(filter.clientId);
      args.push(filter.acctCode);

      // Note that the valid format for filter.time is "yyyymmdd-hh:mm:ss"
      args.push(filter.time);
      args.push(filter.symbol);
      args.push(filter.secType);
      args.push(filter.exchange);
      args.push(filter.side);
    }

    this.sendMsg(args);
  }

  /**
   * Encode a REQ_FUNDAMENTAL_DATA message.
   */
  reqFundamentalData(
    reqId: number,
    contract: Contract,
    reportType: string,
    fundamentalDataOptions: TagValue[]
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.FUNDAMENTAL_DATA) {
      return this.emitError(
        "It does not support fundamental data requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (contract.conId != undefined) {
        return this.emitError(
          "It does not support conId parameter in reqFundamentalData.",
          ErrorCode.UPDATE_TWS,
          reqId
        );
      }
    }

    const version = 2;

    // send req fund data msg
    const tokens: unknown[] = [OUT_MSG_ID.REQ_FUNDAMENTAL_DATA, version, reqId];

    // send contract fields
    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.conId);
    }

    tokens.push(contract.symbol);
    tokens.push(contract.secType);
    tokens.push(contract.exchange);
    tokens.push(contract.primaryExch);
    tokens.push(contract.currency);
    tokens.push(contract.localSymbol);

    tokens.push(reportType);

    if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      tokens.push(this.encodeTagValues(fundamentalDataOptions));
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a REQ_GLOBAL_CANCEL message.
   */
  reqGlobalCancel(): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_GLOBAL_CANCEL) {
      return this.emitError(
        "It does not support globalCancel requests.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_GLOBAL_CANCEL, version);
  }

  /**
   * Encode a REQ_HISTORICAL_DATA message.
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
    keepUpToDate: boolean,
    chartOptions?: TagValue[]
  ): void {
    const version = 6;

    if (this.serverVersion < 16) {
      return this.emitError(
        "It does not support historical data backfill.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (!!contract.tradingClass || contract.conId != undefined) {
        return this.emitError(
          "It does not support conId and tradingClass parameters in reqHistoricalData.",
          ErrorCode.UPDATE_TWS,
          tickerId
        );
      }
    }

    const tokens: unknown[] = [
      OUT_MSG_ID.REQ_HISTORICAL_DATA,
      version,
      tickerId,
    ];

    // send contract fields
    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.conId);
    }

    tokens.push(contract.symbol);
    tokens.push(contract.secType);
    tokens.push(contract.lastTradeDateOrContractMonth);
    tokens.push(contract.strike);
    tokens.push(contract.right);
    tokens.push(contract.multiplier);
    tokens.push(contract.exchange);
    tokens.push(contract.primaryExch);
    tokens.push(contract.currency);
    tokens.push(contract.localSymbol);

    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.tradingClass);
    }

    if (this.serverVersion >= 31) {
      tokens.push(!!contract.includeExpired);
    }

    if (this.serverVersion >= 20) {
      tokens.push(endDateTime);
      tokens.push(barSizeSetting);
    }

    tokens.push(durationStr);
    tokens.push(useRTH);
    tokens.push(whatToShow);

    if (this.serverVersion > 16) {
      tokens.push(formatDate);
    }

    if (SecType.BAG === contract.secType?.toUpperCase()) {
      if (!contract.comboLegs) {
        tokens.push(0);
      } else {
        tokens.push(contract.comboLegs.length);
        contract.comboLegs.forEach((comboLeg) => {
          tokens.push(comboLeg.conId);
          tokens.push(comboLeg.ratio);
          tokens.push(comboLeg.action);
          tokens.push(comboLeg.exchange);
        });
      }
    }

    if (this.serverVersion >= MIN_SERVER_VER.SYNT_REALTIME_BARS) {
      tokens.push(keepUpToDate);
    }

    if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      tokens.push(this.encodeTagValues(chartOptions));
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a REQ_HISTORICAL_TICKS message.
   */
  reqHistoricalTicks(
    tickerId: number,
    contract: Contract,
    startDateTime: string,
    endDateTime: string,
    numberOfTicks: number,
    whatToShow: string,
    useRth: number,
    ignoreSize: boolean,
    miscOptions?: TagValue[]
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.HISTORICAL_TICKS) {
      return this.emitError(
        "It does not support historical ticks request.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    this.sendMsg(
      OUT_MSG_ID.REQ_HISTORICAL_TICKS,
      tickerId,
      this.encodeContract(contract),
      startDateTime,
      endDateTime,
      numberOfTicks,
      whatToShow,
      useRth,
      ignoreSize,
      this.encodeTagValues(miscOptions)
    );
  }

  /**
   * Encode a REQ_TICK_BY_TICK_DATA message.
   */
  reqTickByTickData(
    reqId: number,
    contract: Contract,
    tickType: TickByTickDataType,
    numberOfTicks: number,
    ignoreSize: boolean
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.TICK_BY_TICK) {
      return this.emitError(
        "It does not support tick-by-tick data requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.TICK_BY_TICK_IGNORE_SIZE) {
      if (numberOfTicks != 0 || ignoreSize) {
        return this.emitError(
          "It does not support ignoreSize and numberOfTicks parameters in tick-by-tick data requests.",
          ErrorCode.UPDATE_TWS,
          reqId
        );
      }
    }

    const args: unknown[] = [OUT_MSG_ID.REQ_TICK_BY_TICK_DATA, reqId];

    args.push(contract.conId);
    args.push(contract.symbol);
    args.push(contract.secType);
    args.push(contract.lastTradeDateOrContractMonth);
    args.push(contract.strike);
    args.push(contract.right);
    args.push(contract.multiplier);
    args.push(contract.exchange);
    args.push(contract.primaryExch);
    args.push(contract.currency);
    args.push(contract.localSymbol);
    args.push(contract.tradingClass);
    args.push(tickType);

    if (this.serverVersion >= MIN_SERVER_VER.TICK_BY_TICK_IGNORE_SIZE) {
      args.push(numberOfTicks);
      args.push(ignoreSize);
    }

    this.sendMsg(args);
  }

  /**
   * Encode a CANCEL_TICK_BY_TICK_DATA message.
   */
  cancelTickByTickData(reqId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.TICK_BY_TICK) {
      return this.emitError(
        "It does not support tick-by-tick data cancels.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(OUT_MSG_ID.CANCEL_TICK_BY_TICK_DATA, reqId);
  }

  /**
   * Encode a REQ_IDS message.
   */
  reqIds(numIds: number): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_IDS, version, numIds);
  }

  /**
   * Encode a REQ_IDS message.
   */
  reqManagedAccts(): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_MANAGED_ACCTS, version);
  }

  /**
   * Encode a REQ_MARKET_DATA_TYPE message.
   */
  reqMarketDataType(marketDataType: number): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_MARKET_DATA_TYPE) {
      return this.emitError(
        "It does not support marketDataType requests.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_MARKET_DATA_TYPE, version, marketDataType);
  }

  /**
   * Encode a REQ_MKT_DATA message.
   */
  reqMktData(
    tickerId: number,
    contract: Contract,
    genericTickList: string,
    snapshot: boolean,
    regulatorySnapshot: boolean
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.SNAPSHOT_MKT_DATA && snapshot) {
      return this.emitError(
        "It does not support snapshot market data requests.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.DELTA_NEUTRAL) {
      return this.emitError(
        "It does not support delta-neutral orders.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.REQ_MKT_DATA_CONID) {
      return this.emitError(
        "It does not support conId parameter.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (!!contract.tradingClass) {
        return this.emitError(
          "It does not support tradingClass parameter in reqMarketData.",
          ErrorCode.UPDATE_TWS,
          tickerId
        );
      }
    }

    const version = 11;

    const args: unknown[] = [OUT_MSG_ID.REQ_MKT_DATA, version, tickerId];

    // send contract fields
    if (this.serverVersion >= MIN_SERVER_VER.REQ_MKT_DATA_CONID) {
      args.push(contract.conId);
    }
    args.push(contract.symbol);
    args.push(contract.secType);
    args.push(contract.lastTradeDateOrContractMonth);
    args.push(contract.strike);
    args.push(contract.right);

    if (this.serverVersion >= 15) {
      args.push(contract.multiplier);
    }

    args.push(contract.exchange);

    if (this.serverVersion >= 14) {
      args.push(contract.primaryExch);
    }

    args.push(contract.currency);

    if (this.serverVersion >= 2) {
      args.push(contract.localSymbol);
    }

    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      args.push(contract.tradingClass);
    }

    if (
      this.serverVersion >= 8 &&
      SecType.BAG === contract.secType?.toUpperCase()
    ) {
      if (!contract.comboLegs) {
        args.push(0);
      } else {
        args.push(contract.comboLegs.length);
        contract.comboLegs.forEach((comboLeg) => {
          args.push(comboLeg.conId);
          args.push(comboLeg.ratio);
          args.push(comboLeg.action);
          args.push(comboLeg.exchange);
        });
      }
    }

    if (this.serverVersion >= MIN_SERVER_VER.DELTA_NEUTRAL) {
      if (contract.deltaNeutralContract) {
        args.push(true);
        args.push(contract.deltaNeutralContract.conId);
        args.push(contract.deltaNeutralContract.delta);
        args.push(contract.deltaNeutralContract.price);
      } else {
        args.push(false);
      }
    }

    if (this.serverVersion >= 31) {
      /*
       * Note: Even though SHORTABLE tick type supported only
       *       starting server version 33 it would be relatively
       *       expensive to expose this restriction here.
       *
       *       Therefore we are relying on TWS doing validation.
       */
      args.push(genericTickList);
    }

    if (this.serverVersion >= MIN_SERVER_VER.SNAPSHOT_MKT_DATA) {
      args.push(snapshot);
    }

    if (this.serverVersion >= MIN_SERVER_VER.REQ_SMART_COMPONENTS) {
      args.push(regulatorySnapshot);
    }

    if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      args.push("");
    }

    this.sendMsg(args);
  }

  /**
   * Encode a REQ_MKT_DEPTH message.
   */
  reqMktDepth(
    tickerId: number,
    contract: Contract,
    numRows: number,
    isSmartDepth: boolean,
    mktDepthOptions?: TagValue[]
  ): void {
    if (this.serverVersion < 6) {
      return this.emitError(
        "This feature is only available for versions of TWS >=6",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (!!contract.tradingClass || contract.conId != undefined) {
        return this.emitError(
          "It does not support conId and tradingClass parameters in reqMktDepth.",
          ErrorCode.UPDATE_TWS,
          tickerId
        );
      }
    }

    if (this.serverVersion < MIN_SERVER_VER.SMART_DEPTH && isSmartDepth) {
      return this.emitError(
        "It does not support SMART depth request.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (
      this.serverVersion < MIN_SERVER_VER.MKT_DEPTH_PRIM_EXCHANGE &&
      !!contract.primaryExch
    ) {
      return this.emitError(
        "It does not support primaryExch parameter in reqMktDepth.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    const version = 5;

    // send req mkt data msg
    const tokens: unknown[] = [OUT_MSG_ID.REQ_MKT_DEPTH, version, tickerId];

    // send contract fields
    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.conId);
    }

    tokens.push(contract.symbol);
    tokens.push(contract.secType);
    tokens.push(contract.lastTradeDateOrContractMonth);
    tokens.push(contract.strike);
    tokens.push(contract.right);

    if (this.serverVersion >= 15) {
      tokens.push(contract.multiplier);
    }

    tokens.push(contract.exchange);
    tokens.push(contract.currency);
    tokens.push(contract.localSymbol);

    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.tradingClass);
    }

    if (this.serverVersion >= 19) {
      tokens.push(numRows);
    }

    if (this.serverVersion >= MIN_SERVER_VER.SMART_DEPTH) {
      tokens.push(isSmartDepth);
    }

    if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      tokens.push(this.encodeTagValues(mktDepthOptions));
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a REQ_NEWS_BULLETINS message.
   */
  reqNewsBulletins(allMsgs: boolean): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_NEWS_BULLETINS, version, allMsgs);
  }

  /**
   * Encode a REQ_OPEN_ORDERS message.
   */
  reqOpenOrders(): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_OPEN_ORDERS, version);
  }

  /**
   * Encode a REQ_POSITIONS message.
   */
  reqPositions(): void {
    if (this.serverVersion < MIN_SERVER_VER.ACCT_SUMMARY) {
      return this.emitError(
        "It does not support position requests.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_POSITIONS, version);
  }

  /**
   * Encode a REQ_POSITIONS_MULTI message.
   */
  reqPositionsMulti(
    reqId: number,
    account: string,
    modelCode: string | null
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.MODELS_SUPPORT) {
      return this.emitError(
        "It does not support position requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    const version = 1;

    this.sendMsg(
      OUT_MSG_ID.REQ_POSITIONS_MULTI,
      version,
      reqId,
      account,
      modelCode
    );
  }

  /**
   * Encode a CANCEL_POSITIONS_MULTI message.
   */
  cancelPositionsMulti(reqId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.MODELS_SUPPORT) {
      return this.emitError(
        "It does not support positions multi cancellation.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_POSITIONS_MULTI, version, reqId);
  }

  /**
   * Encode a REQ_REAL_TIME_BARS message.
   */
  reqRealTimeBars(
    tickerId: number,
    contract: Contract,
    barSize: number,
    whatToShow: string,
    useRTH: boolean,
    realTimeBarsOptions: TagValue[]
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.REAL_TIME_BARS) {
      return this.emitError(
        "It does not support real time bars.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (this.serverVersion < MIN_SERVER_VER.TRADING_CLASS) {
      if (!!contract.tradingClass || contract.conId != undefined) {
        return this.emitError(
          "It does not support conId and tradingClass parameters in reqRealTimeBars.",
          ErrorCode.UPDATE_TWS,
          tickerId
        );
      }
    }

    const version = 3;

    // send req mkt data msg
    const tokens: unknown[] = [
      OUT_MSG_ID.REQ_REAL_TIME_BARS,
      version,
      tickerId,
    ];

    // send contract fields
    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.conId);
    }

    tokens.push(contract.symbol);
    tokens.push(contract.secType);
    tokens.push(contract.lastTradeDateOrContractMonth);
    tokens.push(contract.strike);
    tokens.push(contract.right);
    tokens.push(contract.multiplier);
    tokens.push(contract.exchange);
    tokens.push(contract.primaryExch);
    tokens.push(contract.currency);
    tokens.push(contract.localSymbol);

    if (this.serverVersion >= MIN_SERVER_VER.TRADING_CLASS) {
      tokens.push(contract.tradingClass);
    }

    tokens.push(barSize); // this parameter is not currently used
    tokens.push(whatToShow);
    tokens.push(useRTH);

    // send realTimeBarsOptions parameter
    if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      tokens.push(this.encodeTagValues(realTimeBarsOptions));
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a REQ_SCANNER_PARAMETERS message.
   */
  reqScannerParameters(): void {
    if (this.serverVersion < 24) {
      return this.emitError(
        "It does not support API scanner subscription.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_SCANNER_PARAMETERS, version);
  }

  /**
   * Encode a REQ_SCANNER_SUBSCRIPTION message.
   */
  reqScannerSubscription(
    tickerId: number,
    subscription: ScannerSubscription,
    scannerSubscriptionOptions: TagValue[],
    scannerSubscriptionFilterOptions?: TagValue[]
  ): void {
    if (this.serverVersion < 24) {
      return this.emitError(
        "It does not support API scanner subscription.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    if (
      this.serverVersion < MIN_SERVER_VER.SCANNER_GENERIC_OPTS &&
      scannerSubscriptionFilterOptions
    ) {
      return this.emitError(
        "It does not support API scanner subscription generic filter options.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    const version = 4;

    const tokens: unknown[] = [OUT_MSG_ID.REQ_SCANNER_SUBSCRIPTION];

    if (this.serverVersion < MIN_SERVER_VER.SCANNER_GENERIC_OPTS) {
      tokens.push(version);
    }

    tokens.push(tickerId);
    tokens.push(nullifyMax(subscription.numberOfRows));
    tokens.push(subscription.instrument);
    tokens.push(subscription.locationCode);
    tokens.push(subscription.scanCode);
    tokens.push(nullifyMax(subscription.abovePrice));
    tokens.push(nullifyMax(subscription.belowPrice));
    tokens.push(nullifyMax(subscription.aboveVolume));
    tokens.push(nullifyMax(subscription.marketCapAbove));
    tokens.push(nullifyMax(subscription.marketCapBelow));
    tokens.push(subscription.moodyRatingAbove);
    tokens.push(subscription.moodyRatingBelow);
    tokens.push(subscription.spRatingAbove);
    tokens.push(subscription.spRatingBelow);
    tokens.push(subscription.maturityDateAbove);
    tokens.push(subscription.maturityDateBelow);
    tokens.push(nullifyMax(subscription.couponRateAbove));
    tokens.push(nullifyMax(subscription.couponRateBelow));
    tokens.push(subscription.excludeConvertible);

    if (this.serverVersion >= 25) {
      tokens.push(nullifyMax(subscription.averageOptionVolumeAbove));
      tokens.push(subscription.scannerSettingPairs);
    }

    if (this.serverVersion >= 27) {
      tokens.push(subscription.stockTypeFilter);
    }

    if (this.serverVersion >= MIN_SERVER_VER.SCANNER_GENERIC_OPTS) {
      tokens.push(this.encodeTagValues(scannerSubscriptionFilterOptions));
    }

    // send scannerSubscriptionOptions parameter
    if (this.serverVersion >= MIN_SERVER_VER.LINKING) {
      tokens.push(this.encodeTagValues(scannerSubscriptionOptions));
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a REQ_FA message.
   */
  requestFA(faDataType: number): void {
    if (this.serverVersion < 13) {
      return this.emitError(
        "This feature is only available for versions of TWS >= 13.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    const version = 1;

    this.sendMsg(OUT_MSG_ID.REQ_FA, version, faDataType);
  }

  /**
   * Encode a SET_SERVER_LOGLEVEL message.
   */
  setServerLogLevel(logLevel: LogLevel): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.SET_SERVER_LOGLEVEL, version, logLevel);
  }

  /**
   * Encode a QUERY_DISPLAY_GROUPS message.
   */
  queryDisplayGroups(reqId: number): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.QUERY_DISPLAY_GROUPS, version, reqId);
  }

  /**
   * Encode a UPDATE_DISPLAY_GROUP message.
   */
  updateDisplayGroup(reqId: number, contractInfo: string): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.UPDATE_DISPLAY_GROUP, version, reqId, contractInfo);
  }

  /**
   * Encode a SUBSCRIBE_TO_GROUP_EVENTS message.
   */
  subscribeToGroupEvents(reqId: number, groupId: number): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.SUBSCRIBE_TO_GROUP_EVENTS, version, reqId, groupId);
  }

  /**
   * Encode a UNSUBSCRIBE_FROM_GROUP_EVENTS message.
   */
  unsubscribeToGroupEvents(reqId: number): void {
    const version = 1;

    this.sendMsg(OUT_MSG_ID.UNSUBSCRIBE_FROM_GROUP_EVENTS, version, reqId);
  }

  /**
   * Encode a REQ_SEC_DEF_OPT_PARAMS message.
   */
  reqSecDefOptParams(
    reqId: number,
    underlyingSymbol: string,
    futFopExchange: string,
    underlyingSecType: string,
    underlyingConId: number
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.SEC_DEF_OPT_PARAMS_REQ) {
      return this.emitError(
        "It does not support reqSecDefOptParams.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(
      OUT_MSG_ID.REQ_SEC_DEF_OPT_PARAMS,
      reqId,
      underlyingSymbol,
      futFopExchange,
      underlyingSecType,
      underlyingConId
    );
  }

  /**
   * Encode a REQ_SOFT_DOLLAR_TIERS message.
   */
  reqSoftDollarTiers(reqId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.SOFT_DOLLAR_TIER) {
      return this.emitError(
        "It does not support soft dollar tier requests.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_SOFT_DOLLAR_TIERS, reqId);
  }

  /**
   * Encode a REQ_FAMILY_CODES message.
   */
  reqFamilyCodes(): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_FAMILY_CODES) {
      return this.emitError(
        "It does not support family codes request.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_FAMILY_CODES);
  }

  /**
   * Encode a REQ_MATCHING_SYMBOLS message.
   */
  reqMatchingSymbols(reqId: number, pattern: string): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_MATCHING_SYMBOLS) {
      return this.emitError(
        "It does not support matching symbols request.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_MATCHING_SYMBOLS, reqId, pattern);
  }

  /**
   * Encode a REQ_MKT_DEPTH_EXCHANGES message.
   */
  reqMktDepthExchanges(): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_MKT_DEPTH_EXCHANGES) {
      return this.emitError(
        "It does not support market depth exchanges request.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_MKT_DEPTH_EXCHANGES);
  }

  /**
   * Encode a REQ_SMART_COMPONENTS message.
   */
  reqSmartComponents(reqId: number, bboExchange: string): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_SMART_COMPONENTS) {
      return this.emitError(
        "It does not support smart components request.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_SMART_COMPONENTS, reqId, bboExchange);
  }

  /**
   * Encode a REQ_NEWS_ARTICLE message.
   */
  reqNewsArticle(
    reqId: number,
    providerCode: string,
    articleId: string,
    newsArticleOptions: TagValue[]
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_NEWS_ARTICLE) {
      return this.emitError(
        "It does not support news article request.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    const tokens: unknown[] = [
      OUT_MSG_ID.REQ_NEWS_ARTICLE,
      reqId,
      providerCode,
      articleId,
    ];

    if (this.serverVersion >= MIN_SERVER_VER.NEWS_QUERY_ORIGINS) {
      tokens.push(this.encodeTagValues(newsArticleOptions));
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a REQ_NEWS_PROVIDERS message.
   */
  reqNewsProviders(): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_SMART_COMPONENTS) {
      return this.emitError(
        "It does not support smart components request.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_NEWS_PROVIDERS);
  }

  /**
   * Encode a REQ_HISTORICAL_NEWS message.
   */
  reqHistoricalNews(
    reqId: number,
    conId: number,
    providerCodes: string,
    startDateTime: string,
    endDateTime: string,
    totalResults: number,
    historicalNewsOptions: TagValue[]
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_HISTORICAL_NEWS) {
      return this.emitError(
        "It does not support historical news request.",
        ErrorCode.UPDATE_TWS,
        reqId
      );
    }

    const tokens: unknown[] = [
      OUT_MSG_ID.REQ_NEWS_PROVIDERS,
      reqId,
      conId,
      providerCodes,
      startDateTime,
      endDateTime,
      endDateTime,
      totalResults,
    ];

    // send historicalNewsOptions parameter
    if (this.serverVersion >= MIN_SERVER_VER.NEWS_QUERY_ORIGINS) {
      tokens.push(this.encodeTagValues(historicalNewsOptions));
    }

    this.sendMsg(tokens);
  }

  /**
   * Encode a REQ_HISTOGRAM_DATA message.
   */
  reqHistogramData(
    tickerId: number,
    contract: Contract,
    useRTH: boolean,
    timePeriod: string
  ): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_HISTOGRAM) {
      return this.emitError(
        "It does not support histogram requests.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    this.sendMsg(
      OUT_MSG_ID.REQ_HISTOGRAM_DATA,
      tickerId,
      this.encodeContract(contract),
      useRTH,
      timePeriod
    );
  }

  /**
   * Encode a CANCEL_HISTOGRAM_DATA message.
   */
  cancelHistogramData(tickerId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_HISTOGRAM) {
      return this.emitError(
        "It does not support head time stamp requests.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    this.sendMsg(OUT_MSG_ID.CANCEL_HISTOGRAM_DATA, tickerId);
  }

  /**
   * Encode a CANCEL_HISTOGRAM_DATA message.
   */
  cancelHeadTimestamp(tickerId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.CANCEL_HEADTIMESTAMP) {
      return this.emitError(
        "It does not support head time stamp requests canceling.",
        ErrorCode.UPDATE_TWS,
        tickerId
      );
    }

    this.sendMsg(OUT_MSG_ID.CANCEL_HEAD_TIMESTAMP, tickerId);
  }

  /**
   * Encode a REQ_MARKET_RULE message.
   */
  reqMarketRule(marketRuleId: number): void {
    if (this.serverVersion < MIN_SERVER_VER.MARKET_RULES) {
      return this.emitError(
        "It does not support market rule requests.",
        ErrorCode.UPDATE_TWS,
        marketRuleId
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_MARKET_RULE, marketRuleId);
  }

  /**
   * Encode a REQ_MARKET_RULE message.
   */
  reqCompletedOrders(apiOnly: boolean): void {
    if (this.serverVersion < MIN_SERVER_VER.REQ_COMPLETED_ORDERS) {
      return this.emitError(
        "It does not support completed orders requests.",
        ErrorCode.UPDATE_TWS,
        -1
      );
    }

    this.sendMsg(OUT_MSG_ID.REQ_COMPLETED_ORDERS, apiOnly);
  }
}
