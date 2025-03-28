import { IneligibilityReason, PriceIncrement } from "../..";
import { Contract } from "../../api/contract/contract";
import { ContractDescription } from "../../api/contract/contractDescription";
import { ContractDetails } from "../../api/contract/contractDetails";
import { DeltaNeutralContract } from "../../api/contract/deltaNeutralContract";
import {
  FundAssetType,
  FundDistributionPolicyIndicator,
} from "../../api/contract/fund";
import DepthMktDataDescription from "../../api/data/container/depth-mkt-data-description";
import FamilyCode from "../../api/data/container/family-code";
import NewsProvider from "../../api/data/container/news-provider";
import SoftDollarTier from "../../api/data/container/soft-dollar-tier";
import TagValue from "../../api/data/container/tag-value";
import { EventName } from "../../api/data/enum/event-name";
import MIN_SERVER_VER from "../../api/data/enum/min-server-version";
import OptionType from "../../api/data/enum/option-type";
import SecType from "../../api/data/enum/sec-type";
import { HistoricalSession } from "../../api/historical/HistoricalSession";
import { HistogramEntry } from "../../api/historical/histogramEntry";
import { HistoricalTick } from "../../api/historical/historicalTick";
import { HistoricalTickBidAsk } from "../../api/historical/historicalTickBidAsk";
import { HistoricalTickLast } from "../../api/historical/historicalTickLast";
import { TickType } from "../../api/market/tickType";
import ExecutionCondition from "../../api/order/condition/execution-condition";
import MarginCondition from "../../api/order/condition/margin-condition";
import PercentChangeCondition from "../../api/order/condition/percent-change-condition";
import PriceCondition from "../../api/order/condition/price-condition";
import TimeCondition from "../../api/order/condition/time-condition";
import VolumeCondition from "../../api/order/condition/volume-condition";
import { ConjunctionConnection } from "../../api/order/enum/conjunction-connection";
import OrderAction from "../../api/order/enum/order-action";
import { OrderConditionType } from "../../api/order/enum/order-condition-type";
import { OrderStatus } from "../../api/order/enum/order-status";
import { OrderType, isPegBenchOrder } from "../../api/order/enum/orderType";
import { TimeInForce } from "../../api/order/enum/tif";
import { TriggerMethod } from "../../api/order/enum/trigger-method";
import { Execution } from "../../api/order/execution";
import { Order } from "../../api/order/order";
import { OrderState } from "../../api/order/orderState";
import { CommissionReport } from "../../api/report/commissionReport";
import { ErrorCode } from "../../common/errorCode";
import { IN_MSG_ID } from "./enum/in-msg-id";

/**
 * @internal
 *
 * Verify if the value is a valid OptionType.
 * Returns the value is valid, undefined otherwise.
 */
function validateOptionType(v: OptionType): OptionType | undefined {
  return Object.values(OptionType).indexOf(v) !== -1 ? v : undefined;
}

/**
 * @internal
 *
 * An underrun error on the input de-serialization.
 */
export class UnderrunError extends Error {
  constructor(public message: string = "An underrun error has occurred") {
    super();
  }

  readonly stack = new Error().stack;
  readonly name = "UnderrunError";
}

/**
 * @internal
 *
 * An item on the emit queue.
 */
interface EmitQueueItem {
  /** Event name. */
  name: EventName;

  /** Event arguments. */
  args: unknown[];
}

/**
 * @internal
 *
 * Callback interface of the [[Decoder]].
 */
export interface DecoderCallbacks {
  /** Get the IB API server version. */
  readonly serverVersion: number;

  /**
   * Emit an event to public API interface.
   *
   * @param eventName Event name.
   * @param args Event arguments.
   */
  emitEvent(eventName: EventName, ...args: unknown[]): void;

  /**
   * Emit an error event to public API interface.
   *
   * @param errMsg The error test message.
   * @param code The code identifying the error.
   * @param reqId The request identifier which generated the error.
   * @param advancedOrderReject An object providing more information in case of an order rejection
   */
  emitError(
    errMsg: string,
    code: number,
    reqId?: number,
    advancedOrderReject?: unknown,
  ): void;

  /**
   * Emit an information message event to public API interface.
   *
   * @param message The message text.
   * @param code The message code.
   */
  emitInfo(message: string, code: number): void;
}

/**
 * @internal
 *
 * Class for decoding token data to messages and emitting events it to the
 * [[Controller]] event queue.
 */
export class Decoder {
  /**
   * Create an [[Incoming]] object.
   *
   * @param callback A [[DecoderCallbacks]] implementation.
   */
  constructor(private callback: DecoderCallbacks) {}

  /**
   * Input data queue.
   *
   * If the value is a string, this is a tokens as received from TWS / IB Gateway.
   * If the value is undefined, this signals the boundary (start or end) of a message (used with V100 protocol only).
   */
  private dataQueue: (string | undefined)[] = [];

  /** Data emit queue (data to be emitted to controller). */
  private emitQueue: EmitQueueItem[] = [];

  /**
   * Add a new message to queue.
   *
   * Used on V100 protocol.
   */
  enqueueMessage(tokens: string[]): void {
    this.dataQueue.push(undefined); // signal start boundary
    this.dataQueue = this.dataQueue.concat(tokens);
    this.dataQueue.push(undefined); // signal end boundary
  }

  /**
   * Add new tokens to queue.
   *
   * Used on pre-V100 protocol.
   */
  enqueueTokens(tokens: string[]): void {
    this.dataQueue = this.dataQueue.concat(tokens);
  }

  /**
   * Process a message on data queue.
   */
  processMsg(msgId: IN_MSG_ID): void {
    switch (msgId) {
      case IN_MSG_ID.TICK_PRICE:
        return this.decodeMsg_TICK_PRICE();
      case IN_MSG_ID.TICK_SIZE:
        return this.decodeMsg_TICK_SIZE();
      case IN_MSG_ID.ORDER_STATUS:
        return this.decodeMsg_ORDER_STATUS();
      case IN_MSG_ID.ERR_MSG:
        return this.decodeMsg_ERR_MSG();
      case IN_MSG_ID.OPEN_ORDER:
        return this.decodeMsg_OPEN_ORDER();
      case IN_MSG_ID.ACCT_VALUE:
        return this.decodeMsg_ACCT_VALUE();
      case IN_MSG_ID.PORTFOLIO_VALUE:
        return this.decodeMsg_PORTFOLIO_VALUE();
      case IN_MSG_ID.ACCT_UPDATE_TIME:
        return this.decodeMsg_ACCT_UPDATE_TIME();
      case IN_MSG_ID.NEXT_VALID_ID:
        return this.decodeMsg_NEXT_VALID_ID();
      case IN_MSG_ID.CONTRACT_DATA:
        return this.decodeMsg_CONTRACT_DATA();
      case IN_MSG_ID.EXECUTION_DATA:
        return this.decodeMsg_EXECUTION_DATA();
      case IN_MSG_ID.MARKET_DEPTH:
        return this.decodeMsg_MARKET_DEPTH();
      case IN_MSG_ID.MARKET_DEPTH_L2:
        return this.decodeMsg_MARKET_DEPTH_L2();
      case IN_MSG_ID.NEWS_BULLETINS:
        return this.decodeMsg_NEWS_BULLETINS();
      case IN_MSG_ID.MANAGED_ACCTS:
        return this.decodeMsg_MANAGED_ACCTS();
      case IN_MSG_ID.RECEIVE_FA:
        return this.decodeMsg_RECEIVE_FA();
      case IN_MSG_ID.HISTORICAL_DATA:
        return this.decodeMsg_HISTORICAL_DATA();
      case IN_MSG_ID.BOND_CONTRACT_DATA:
        return this.decodeMsg_BOND_CONTRACT_DATA();
      case IN_MSG_ID.SCANNER_PARAMETERS:
        return this.decodeMsg_SCANNER_PARAMETERS();
      case IN_MSG_ID.SCANNER_DATA:
        return this.decodeMsg_SCANNER_DATA();
      case IN_MSG_ID.TICK_OPTION_COMPUTATION:
        return this.decodeMsg_TICK_OPTION_COMPUTATION();
      case IN_MSG_ID.TICK_GENERIC:
        return this.decodeMsg_TICK_GENERIC();
      case IN_MSG_ID.TICK_STRING:
        return this.decodeMsg_TICK_STRING();
      case IN_MSG_ID.TICK_EFP:
        return this.decodeMsg_TICK_EFP();
      case IN_MSG_ID.CURRENT_TIME:
        return this.decodeMsg_CURRENT_TIME();
      case IN_MSG_ID.REAL_TIME_BARS:
        return this.decodeMsg_REAL_TIME_BARS();
      case IN_MSG_ID.FUNDAMENTAL_DATA:
        return this.decodeMsg_FUNDAMENTAL_DATA();
      case IN_MSG_ID.CONTRACT_DATA_END:
        return this.decodeMsg_CONTRACT_DATA_END();
      case IN_MSG_ID.OPEN_ORDER_END:
        return this.decodeMsg_OPEN_ORDER_END();
      case IN_MSG_ID.ACCT_DOWNLOAD_END:
        return this.decodeMsg_ACCT_DOWNLOAD_END();
      case IN_MSG_ID.EXECUTION_DATA_END:
        return this.decodeMsg_EXECUTION_DATA_END();
      case IN_MSG_ID.DELTA_NEUTRAL_VALIDATION:
        return this.decodeMsg_DELTA_NEUTRAL_VALIDATION();
      case IN_MSG_ID.TICK_SNAPSHOT_END:
        return this.decodeMsg_TICK_SNAPSHOT_END();
      case IN_MSG_ID.MARKET_DATA_TYPE:
        return this.decodeMsg_MARKET_DATA_TYPE();
      case IN_MSG_ID.COMMISSION_REPORT:
        return this.decodeMsg_COMMISSION_REPORT();
      case IN_MSG_ID.POSITION:
        return this.decodeMsg_POSITION();
      case IN_MSG_ID.POSITION_END:
        return this.decodeMsg_POSITION_END();
      case IN_MSG_ID.ACCOUNT_SUMMARY:
        return this.decodeMsg_ACCOUNT_SUMMARY();
      case IN_MSG_ID.ACCOUNT_SUMMARY_END:
        return this.decodeMsg_ACCOUNT_SUMMARY_END();
      /* For IB's internal purpose - not implement:
      case IN_MSG_ID.VERIFY_MESSAGE_API:
      case IN_MSG_ID.VERIFY_COMPLETED:
      */
      case IN_MSG_ID.DISPLAY_GROUP_LIST:
        return this.decodeMsg_DISPLAY_GROUP_LIST();
      case IN_MSG_ID.DISPLAY_GROUP_UPDATED:
        return this.decodeMsg_DISPLAY_GROUP_UPDATED();
      /* For IB's internal purpose - not implement:
      case IN_MSG_ID.VERIFY_AND_AUTH_MESSAGE_API:
      case IN_MSG_ID.VERIFY_AND_AUTH_COMPLETED
      */
      case IN_MSG_ID.POSITION_MULTI:
        return this.decodeMsg_POSITION_MULTI();
      case IN_MSG_ID.POSITION_MULTI_END:
        return this.decodeMsg_POSITION_MULTI_END();
      case IN_MSG_ID.ACCOUNT_UPDATE_MULTI:
        return this.decodeMsg_ACCOUNT_UPDATE_MULTI();
      case IN_MSG_ID.ACCOUNT_UPDATE_MULTI_END:
        return this.decodeMsg_ACCOUNT_UPDATE_MULTI_END();
      case IN_MSG_ID.SECURITY_DEFINITION_OPTION_PARAMETER:
        return this.decodeMsg_SECURITY_DEFINITION_OPTION_PARAMETER();
      case IN_MSG_ID.SECURITY_DEFINITION_OPTION_PARAMETER_END:
        return this.decodeMsg_SECURITY_DEFINITION_OPTION_PARAMETER_END();
      case IN_MSG_ID.SOFT_DOLLAR_TIERS:
        return this.decodeMsg_SOFT_DOLLAR_TIERS();
      case IN_MSG_ID.FAMILY_CODES:
        return this.decodeMsg_FAMILY_CODES();
      case IN_MSG_ID.SYMBOL_SAMPLES:
        return this.decodeMsg_SYMBOL_SAMPLES();
      case IN_MSG_ID.MKT_DEPTH_EXCHANGES:
        return this.decodeMsg_MKT_DEPTH_EXCHANGES();
      case IN_MSG_ID.TICK_REQ_PARAMS:
        return this.decodeMsg_TICK_REQ_PARAMS();
      case IN_MSG_ID.SMART_COMPONENTS:
        return this.decodeMsg_SMART_COMPONENTS();
      case IN_MSG_ID.NEWS_ARTICLE:
        return this.decodeMsg_NEWS_ARTICLE();
      case IN_MSG_ID.TICK_NEWS:
        return this.decodeMsg_TICK_NEWS();
      case IN_MSG_ID.NEWS_PROVIDERS:
        return this.decodeMsg_NEWS_PROVIDERS();
      case IN_MSG_ID.HISTORICAL_NEWS:
        return this.decodeMsg_HISTORICAL_NEWS();
      case IN_MSG_ID.HISTORICAL_NEWS_END:
        return this.decodeMsg_HISTORICAL_NEWS_END();
      case IN_MSG_ID.HEAD_TIMESTAMP:
        return this.decodeMsg_HEAD_TIMESTAMP();
      case IN_MSG_ID.HISTOGRAM_DATA:
        return this.decodeMsg_HISTOGRAM_DATA();
      case IN_MSG_ID.HISTORICAL_DATA_UPDATE:
        return this.decodeMsg_HISTORICAL_DATA_UPDATE();
      case IN_MSG_ID.REROUTE_MKT_DATA:
        return this.decodeMsg_REROUTE_MKT_DATA();
      case IN_MSG_ID.REROUTE_MKT_DEPTH:
        return this.decodeMsg_REROUTE_MKT_DEPTH();
      case IN_MSG_ID.MARKET_RULE:
        return this.decodeMsg_MARKET_RULE();
      case IN_MSG_ID.PNL:
        return this.decodeMsg_PNL();
      case IN_MSG_ID.PNL_SINGLE:
        return this.decodeMsg_PNL_SINGLE();
      case IN_MSG_ID.HISTORICAL_TICKS:
        return this.decodeMsg_HISTORICAL_TICKS();
      case IN_MSG_ID.HISTORICAL_TICKS_BID_ASK:
        return this.decodeMsg_HISTORICAL_TICKS_BID_ASK();
      case IN_MSG_ID.HISTORICAL_TICKS_LAST:
        return this.decodeMsg_HISTORICAL_TICKS_LAST();
      case IN_MSG_ID.TICK_BY_TICK:
        return this.decodeMsg_TICK_BY_TICK();
      case IN_MSG_ID.ORDER_BOUND:
        return this.decodeMsg_ORDER_BOUND();
      case IN_MSG_ID.COMPLETED_ORDER:
        return this.decodeMsg_COMPLETED_ORDER();
      case IN_MSG_ID.COMPLETED_ORDERS_END:
        return this.decodeMsg_COMPLETED_ORDERS_END();
      case IN_MSG_ID.REPLACE_FA_END:
        return this.decodeMsg_REPLACE_FA_END();
      case IN_MSG_ID.WSH_META_DATA:
        return this.decodeMsg_WSH_META_DATA();
      case IN_MSG_ID.WSH_EVENT_DATA:
        return this.decodeMsg_WSH_EVENT_DATA();
      case IN_MSG_ID.HISTORICAL_SCHEDULE:
        return this.decodeMsg_HISTORICAL_SCHEDULE();
      case IN_MSG_ID.USER_INFO:
        return this.decodeMsg_USER_INFO();

      default:
        this.callback.emitError(
          `No parser implementation found for token: ${IN_MSG_ID[msgId]} (${msgId}).`,
          ErrorCode.UNKNOWN_ID,
        );
    }
  }

  /**
   * Process the data queue and emit events.
   */
  process(): void {
    while (true) {
      // verify there is data to process

      if (!this.dataQueue.length) {
        break;
      }

      // clear event queue

      this.emitQueue = [];

      // check if there is a message boundary marker

      let verifyMessageBoundary = false;
      if (this.dataQueue[0] === undefined) {
        verifyMessageBoundary = true;
        this.dataQueue.shift();
      }

      let msgId: IN_MSG_ID = IN_MSG_ID.UNDEFINED;

      try {
        // process message (invoke decoder function)

        msgId = this.readInt();
        this.processMsg(msgId);

        // check if all of the message data was processed and drain any remaining tokens

        if (verifyMessageBoundary) {
          if (this.dataQueue[0] !== undefined) {
            this.callback.emitError(
              `Decoding error on ${
                IN_MSG_ID[msgId]
              }: unprocessed data left on queue (${JSON.stringify(
                this.dataQueue,
              )}). Please report to https://github.com/stoqey/ib`,
              ErrorCode.UNKNOWN_ID,
            );
          }

          this.drainQueue();
        }
      } catch (e) {
        if (e.name !== "UnderrunError") {
          throw e;
        }

        if (verifyMessageBoundary) {
          this.callback.emitError(
            `Underrun error on ${IN_MSG_ID[msgId]}: ${e.message} Please report to https://github.com/stoqey/ib`,
            ErrorCode.UNKNOWN_ID,
          );
        }

        this.drainQueue();
      }

      // Emit events

      const toEmit = this.emitQueue;
      this.emitQueue = [];
      toEmit.forEach((item) =>
        this.callback.emitEvent(item.name, ...item.args),
      );
    }
  }

  /**
   * Get the API server version.
   */
  private get serverVersion(): number {
    return this.callback.serverVersion;
  }

  private decodeUnicodeEscapedString(str: string) {
    let v = str;

    try {
      while (true) {
        const escapeIndex: number = v.indexOf("\\u");

        if (escapeIndex == -1 || v.length - escapeIndex < 6) {
          break;
        }

        const escapeString: string = v.substring(escapeIndex, escapeIndex + 6);
        const hexVal: number = parseInt(escapeString.replace("\\u", ""), 16);

        v = v.replace(escapeString, String.fromCharCode(hexVal));
      }
    } catch (_e) {
      /* TODO: handle error? */
    }

    return v;
  }

  /**
   * Read a string token from queue.
   */
  readStr(): string {
    if (this.dataQueue.length === 0) {
      throw new UnderrunError();
    }
    const val = this.dataQueue.shift();
    if (val === undefined) {
      throw new UnderrunError("End of message reached.");
    }
    return val;
  }

  /**
   * Read a token from queue and return it as boolean value.
   */
  readBool(): boolean {
    return !!parseInt(this.readStr());
  }

  /**
   * Read a token from queue and return it as boolean value.
   *
   * @deprecated readBool is probably what you are looking for
   */
  readBoolFromInt = this.readBool;

  /**
   * Read a token from queue and return it as floating point value.
   *
   * Returns 0 if the token is empty.
   * Returns undefined is the token is Number.MAX_VALUE.
   */
  readDouble(): number | undefined {
    const token = this.readStr();
    if (token === "") {
      return 0;
    }
    const val = parseFloat(token);
    return val === Number.MAX_VALUE ? undefined : val;
  }

  /**
   * Read a token from queue and return it as floating point value.
   *
   * Returns undefined if the token is empty or is Number.MAX_VALUE.
   */
  readDecimal(): number | undefined {
    const token = this.readStr();
    if (token === "") {
      return undefined;
    }
    const val = parseFloat(token.replaceAll(",", ""));
    return val === Number.MAX_VALUE || val === Infinity ? undefined : val;
  }

  /**
   * Read a token from queue and return it as floating point value.
   *
   * Returns undefined if the token is empty or Number.MAX_VALUE.
   */
  readDoubleOrUndefined(): number | undefined {
    const token = this.readStr();
    if (token === "") {
      return undefined;
    }
    const val = parseFloat(token);
    return val === Number.MAX_VALUE ? undefined : val;
  }

  /**
   * Read a token from queue and return it as integer value.
   *
   * Returns 0 if the token is empty.
   */
  readInt(): number {
    const token = this.readStr();
    if (token === "") {
      return 0;
    }
    const val = parseInt(token, 10);
    return val;
  }

  /**
   * Read a token from queue and return it as integer value.
   *
   * Returns Number.MAX_VALUE if the token is empty.
   * @deprecated readIntOrUndefined is probably what you are looking for
   */
  readIntMax = this.readIntOrUndefined;

  /**
   * Read a token from queue and return it as integer value.
   *
   * Returns undefined if the token is empty or `2147483647`.
   */
  readIntOrUndefined(): number | undefined {
    const token = this.readStr();
    if (token === "") {
      return undefined;
    }
    const val = parseInt(token, 10);
    return val === 2147483647 ? undefined : val;
  }

  /**
   * Drain all tokens on queue until the start marker of a new message or until queue is empty.
   */
  private drainQueue(): void {
    // drain data up to message end marker or until queue is empty

    while (this.dataQueue.length && this.dataQueue[0] !== undefined) {
      this.dataQueue.shift();
    }

    if (this.dataQueue.length) {
      // drain the end marker

      this.dataQueue.shift();
    }
  }

  /**
   * Add tokens to the emit queue.
   */
  private emit(eventName: EventName, ...args: unknown[]): void {
    this.emitQueue.push({ name: eventName, args: args });
  }

  /**
   * Decode a TICK_PRICE message from data queue and emit a tickPrice and tickSize event.
   */
  private decodeMsg_TICK_PRICE(): void {
    // read from input queue

    const version = this.readInt();
    const tickerId = this.readInt();
    const tickType = this.readInt();
    const price = this.readDouble();

    let size = undefined;
    if (version >= 2) {
      size = this.readDecimal();
    }

    let canAutoExecute = undefined;
    if (version >= 3) {
      canAutoExecute = this.readBool();
    }

    // emit events

    this.emit(EventName.tickPrice, tickerId, tickType, price, canAutoExecute);

    let sizeTickType = undefined;
    if (version >= 2) {
      switch (tickType) {
        case TickType.BID:
          sizeTickType = TickType.BID_SIZE;
          break;
        case TickType.ASK:
          sizeTickType = TickType.ASK_SIZE;
          break;
        case TickType.LAST:
          sizeTickType = TickType.LAST_SIZE;
          break;
        case TickType.DELAYED_BID:
          sizeTickType = TickType.DELAYED_BID_SIZE;
          break;
        case TickType.DELAYED_ASK:
          sizeTickType = TickType.DELAYED_ASK_SIZE;
          break;
        case TickType.DELAYED_LAST:
          sizeTickType = TickType.DELAYED_LAST_SIZE;
          break;
      }
    }

    if (sizeTickType) {
      this.emit(EventName.tickSize, tickerId, sizeTickType, size);
    }
  }

  /**
   * Decode a TICK_SIZE message from data queue and emit an tickSize event.
   */
  private decodeMsg_TICK_SIZE(): void {
    this.readInt(); // version
    const tickerId = this.readInt();
    const tickType = this.readInt();
    const size = this.readDecimal();

    this.emit(EventName.tickSize, tickerId, tickType, size);
  }

  /**
   * Decode a ORDER_STATUS message from data queue and emit an orderStatus event.
   */
  private decodeMsg_ORDER_STATUS(): void {
    const version =
      this.serverVersion >= MIN_SERVER_VER.MARKET_CAP_PRICE
        ? Number.MAX_SAFE_INTEGER
        : this.readInt();
    const id = this.readInt();
    const status = this.readStr();
    const filled = this.readDecimal();
    const remaining = this.readDecimal();
    const avgFillPrice = this.readDouble();

    let permId: number | undefined = undefined;
    if (version >= 2) {
      permId = this.readInt();
    }

    let parentId: number | undefined = undefined;
    if (version >= 3) {
      parentId = this.readInt();
    }

    let lastFillPrice: number | undefined = undefined;
    if (version >= 4) {
      lastFillPrice = this.readDouble();
    }

    let clientId: number | undefined = undefined;
    if (version >= 5) {
      clientId = this.readInt();
    }

    let whyHeld: string | undefined = undefined;
    if (version >= 6) {
      whyHeld = this.readStr();
    }

    let mktCapPrice: number | undefined = undefined;
    if (this.serverVersion >= MIN_SERVER_VER.MARKET_CAP_PRICE) {
      mktCapPrice = this.readDouble();
    }

    this.emit(
      EventName.orderStatus,
      id,
      status,
      filled,
      remaining,
      avgFillPrice,
      permId,
      parentId,
      lastFillPrice,
      clientId,
      whyHeld,
      mktCapPrice,
    );
  }

  /**
   * Decode a ERR_MSG message from data queue and emit and error event.
   */
  private decodeMsg_ERR_MSG(): void {
    const version = this.readInt();
    if (version < 2) {
      const errorMsg = this.readStr();
      this.callback.emitError(errorMsg, ErrorCode.UNKNOWN_ID);
    } else {
      const id = this.readInt();
      const code = this.readInt();
      let msg = this.readStr();
      if (this.serverVersion >= MIN_SERVER_VER.ENCODE_MSG_ASCII7) {
        msg = this.decodeUnicodeEscapedString(msg);
      }
      let advancedOrderReject: unknown;
      if (this.serverVersion >= MIN_SERVER_VER.ADVANCED_ORDER_REJECT) {
        const advancedOrderRejectJson: string = this.readStr();
        if (advancedOrderRejectJson?.length > 0) {
          advancedOrderReject = JSON.parse(
            this.decodeUnicodeEscapedString(advancedOrderRejectJson),
          );
        }
      }

      if (id === ErrorCode.NO_VALID_ID) {
        this.callback.emitInfo(msg, code);
      } else {
        this.callback.emitError(msg, code, id, advancedOrderReject);
      }
    }
  }

  /**
   * Decode a OPEN_ORDER message from data queue and emit a openOrder event.
   */
  private decodeMsg_OPEN_ORDER(): void {
    // read version
    const version =
      this.serverVersion < MIN_SERVER_VER.ORDER_CONTAINER
        ? this.readInt()
        : this.serverVersion;

    const contract: Contract = {};
    const order: Order = {};
    const orderState: OrderState = {};
    const orderDecoder = new OrderDecoder(
      this,
      contract,
      order,
      orderState,
      version,
      this.serverVersion,
    );

    // read order id
    orderDecoder.readOrderId();

    // read contract fields
    orderDecoder.readContractFields();

    // read order fields
    orderDecoder.readAction();
    orderDecoder.readTotalQuantity();
    orderDecoder.readOrderType();
    orderDecoder.readLmtPrice();
    orderDecoder.readAuxPrice();
    orderDecoder.readTIF();
    orderDecoder.readOcaGroup();
    orderDecoder.readAccount();
    orderDecoder.readOpenClose();
    orderDecoder.readOrigin();
    orderDecoder.readOrderRef();
    orderDecoder.readClientId();
    orderDecoder.readPermId();
    orderDecoder.readOutsideRth();
    orderDecoder.readHidden();
    orderDecoder.readDiscretionaryAmount();
    orderDecoder.readGoodAfterTime();
    orderDecoder.skipSharesAllocation();
    orderDecoder.readFAParams();
    orderDecoder.readModelCode();
    orderDecoder.readGoodTillDate();
    orderDecoder.readRule80A();
    orderDecoder.readPercentOffset();
    orderDecoder.readSettlingFirm();
    orderDecoder.readShortSaleParams();
    orderDecoder.readAuctionStrategy();
    orderDecoder.readBoxOrderParams();
    orderDecoder.readPegToStkOrVolOrderParams();
    orderDecoder.readDisplaySize();
    orderDecoder.readOldStyleOutsideRth();
    orderDecoder.readBlockOrder();
    orderDecoder.readSweepToFill();
    orderDecoder.readAllOrNone();
    orderDecoder.readMinQty();
    orderDecoder.readOcaType();
    orderDecoder.readETradeOnly();
    orderDecoder.readFirmQuoteOnly();
    orderDecoder.readNbboPriceCap();
    orderDecoder.readParentId();
    orderDecoder.readTriggerMethod();
    orderDecoder.readVolOrderParams(true);
    orderDecoder.readTrailParams();
    orderDecoder.readBasisPoints();
    orderDecoder.readComboLegs();
    orderDecoder.readSmartComboRoutingParams();
    orderDecoder.readScaleOrderParams();
    orderDecoder.readHedgeParams();
    orderDecoder.readOptOutSmartRouting();
    orderDecoder.readClearingParams();
    orderDecoder.readNotHeld();
    orderDecoder.readDeltaNeutral();
    orderDecoder.readAlgoParams();
    orderDecoder.readSolicited();
    orderDecoder.readWhatIfInfoAndCommission();
    orderDecoder.readVolRandomizeFlags();
    orderDecoder.readPegToBenchParams();
    orderDecoder.readConditions();
    orderDecoder.readAdjustedOrderParams();
    orderDecoder.readSoftDollarTier();
    orderDecoder.readCashQty();
    orderDecoder.readDontUseAutoPriceForHedge();
    orderDecoder.readIsOmsContainer();
    orderDecoder.readDiscretionaryUpToLimitPrice();
    orderDecoder.readUsePriceMgmtAlgo();
    orderDecoder.readDuration();
    orderDecoder.readPostToAts();
    orderDecoder.readAutoCancelParent(MIN_SERVER_VER.AUTO_CANCEL_PARENT);
    orderDecoder.readPegBestPegMidOrderAttributes();
    orderDecoder.readCustomerAccount();
    orderDecoder.readProfessionalCustomer();
    orderDecoder.readBondAccruedInterest();
    orderDecoder.readIncludeOvernight();
    orderDecoder.readCMETaggingFields();

    this.emit(EventName.openOrder, order.orderId, contract, order, orderState);
  }

  /**
   * Decode a OPEN_ORDER message from data queue and emit a updateAccountValue event.
   */
  private decodeMsg_ACCT_VALUE(): void {
    this.readInt(); // version
    const key = this.readStr();
    const value = this.readStr();
    const currency = this.readStr();
    const accountName = this.readStr();

    this.emit(EventName.updateAccountValue, key, value, currency, accountName);
  }

  /**
   * Decode a PORTFOLIO_VALUE message from data queue and emit a updatePortfolio (PortfolioValue) event.
   */
  private decodeMsg_PORTFOLIO_VALUE(): void {
    const version = this.readInt();

    const contract: Contract = {};
    if (version >= 6) {
      contract.conId = this.readInt();
    }
    contract.symbol = this.readStr();
    contract.secType = this.readStr() as SecType;
    contract.lastTradeDateOrContractMonth = this.readStr();
    contract.strike = this.readDouble();
    contract.right = validateOptionType(this.readStr() as OptionType);

    if (version >= 7) {
      contract.multiplier = this.readDouble();
      contract.primaryExch = this.readStr();
    }

    contract.currency = this.readStr();

    if (version >= 2) {
      contract.localSymbol = this.readStr();
    }

    if (version >= 8) {
      contract.tradingClass = this.readStr();
    }

    const position: number = this.readDecimal();

    const marketPrice = this.readDouble();
    const marketValue = this.readDouble();
    let averageCost: number | undefined = undefined;
    let unrealizedPNL: number | undefined = undefined;
    let realizedPNL: number | undefined = undefined;
    if (version >= 3) {
      averageCost = this.readDouble();
      unrealizedPNL = this.readDouble();
      realizedPNL = this.readDouble();
    }

    let accountName: string | undefined = undefined;
    if (version >= 4) {
      accountName = this.readStr();
    }

    if (version === 6 && this.serverVersion === 39) {
      contract.primaryExch = this.readStr();
    }

    this.emit(
      EventName.updatePortfolio,
      contract,
      position,
      marketPrice,
      marketValue,
      averageCost,
      unrealizedPNL,
      realizedPNL,
      accountName,
    );
  }

  /**
   * Decode a ACCT_UPDATE_TIME message from data queue and emit a updateAccountTime event.
   */
  private decodeMsg_ACCT_UPDATE_TIME(): void {
    this.readInt(); // version
    const timeStamp = this.readStr();

    this.emit(EventName.updateAccountTime, timeStamp);
  }

  /**
   * Decode a NEXT_VALID_ID message from data queue and emit a nextValidId event.
   */
  private decodeMsg_NEXT_VALID_ID(): void {
    this.readInt(); // version
    const orderId = this.readInt();

    this.emit(EventName.nextValidId, orderId);
  }

  /**
   * Decode a CONTRACT_DATA message from data queue and emit a contractDetails event.
   */
  private decodeMsg_CONTRACT_DATA(): void {
    let version = 8;
    if (this.serverVersion < MIN_SERVER_VER.SIZE_RULES) {
      version = this.readInt();
    }

    let reqId = -1;
    if (version >= 3) {
      reqId = this.readInt();
    }

    const contract: ContractDetails = {
      contract: {},
    };

    contract.contract.symbol = this.readStr();
    contract.contract.secType = this.readStr() as SecType;
    this.readLastTradeDate(contract, false);
    if (this.serverVersion >= MIN_SERVER_VER.LAST_TRADE_DATE) {
      contract.contract.lastTradeDate = this.readStr();
    }
    contract.contract.strike = this.readDouble();
    contract.contract.right = validateOptionType(this.readStr() as OptionType);
    contract.contract.exchange = this.readStr();
    contract.contract.currency = this.readStr();
    contract.contract.localSymbol = this.readStr();
    contract.marketName = this.readStr();
    contract.contract.tradingClass = this.readStr();
    contract.contract.conId = this.readInt();
    contract.minTick = this.readDouble();
    if (
      this.serverVersion >= MIN_SERVER_VER.MD_SIZE_MULTIPLIER &&
      this.serverVersion < MIN_SERVER_VER.SIZE_RULES
    ) {
      this.readInt(); // mdSizeMultiplier - not used anymore
    }
    contract.contract.multiplier = this.readDouble();
    contract.orderTypes = this.readStr();
    contract.validExchanges = this.readStr();

    if (version >= 2) {
      contract.priceMagnifier = this.readInt();
    }

    if (version >= 4) {
      contract.underConId = this.readInt();
    }

    if (version >= 5) {
      contract.longName = this.readStr();
      contract.contract.primaryExch = this.readStr();

      if (this.serverVersion >= MIN_SERVER_VER.ENCODE_MSG_ASCII7) {
        contract.longName = this.decodeUnicodeEscapedString(contract.longName);
      }
    }

    if (version >= 6) {
      contract.contractMonth = this.readStr();
      contract.industry = this.readStr();
      contract.category = this.readStr();
      contract.subcategory = this.readStr();
      contract.timeZoneId = this.readStr();
      contract.tradingHours = this.readStr();
      contract.liquidHours = this.readStr();
    }

    if (version >= 8) {
      contract.evRule = this.readStr();
      contract.evMultiplier = this.readDouble();
    }

    if (version >= 7) {
      const secIdListCount = this.readInt();
      if (secIdListCount > 0) {
        contract.secIdList = [];
        for (let i = 0; i < secIdListCount; ++i) {
          const tagValue: TagValue = {
            tag: this.readStr(),
            value: this.readStr(),
          };
          contract.secIdList.push(tagValue);
        }
      }
    }

    if (this.serverVersion >= MIN_SERVER_VER.AGG_GROUP) {
      contract.aggGroup = this.readInt();
    }

    if (this.serverVersion >= MIN_SERVER_VER.UNDERLYING_INFO) {
      contract.underSymbol = this.readStr();
      contract.underSecType = this.readStr() as SecType;
    }

    if (this.serverVersion >= MIN_SERVER_VER.MARKET_RULES) {
      contract.marketRuleIds = this.readStr();
    }

    if (this.serverVersion >= MIN_SERVER_VER.REAL_EXPIRATION_DATE) {
      contract.realExpirationDate = this.readStr();
    }

    if (this.serverVersion >= MIN_SERVER_VER.STOCK_TYPE) {
      contract.stockType = this.readStr();
    }

    if (
      this.serverVersion >= MIN_SERVER_VER.FRACTIONAL_SIZE_SUPPORT &&
      this.serverVersion < MIN_SERVER_VER.SIZE_RULES
    ) {
      this.readDecimal(); // sizeMinTick - not used anymore
    }

    if (this.serverVersion >= MIN_SERVER_VER.SIZE_RULES) {
      contract.minSize = this.readDecimal();
      contract.sizeIncrement = this.readDecimal();
      contract.suggestedSizeIncrement = this.readDecimal();
    }

    if (
      this.serverVersion >= MIN_SERVER_VER.FUND_DATA_FIELDS &&
      contract.contract.secType == SecType.FUND
    ) {
      contract.fundName = this.readStr();
      contract.fundFamily = this.readStr();
      contract.fundType = this.readStr();
      contract.fundFrontLoad = this.readStr();
      contract.fundBackLoad = this.readStr();
      contract.fundBackLoadTimeInterval = this.readStr();
      contract.fundManagementFee = this.readStr();
      contract.fundClosed = this.readBool();
      contract.fundClosedForNewInvestors = this.readBool();
      contract.fundClosedForNewMoney = this.readBool();
      contract.fundNotifyAmount = this.readStr();
      contract.fundMinimumInitialPurchase = this.readStr();
      contract.fundSubsequentMinimumPurchase = this.readStr();
      contract.fundBlueSkyStates = this.readStr();
      contract.fundBlueSkyTerritories = this.readStr();
      contract.fundDistributionPolicyIndicator =
        this.readStr() as FundDistributionPolicyIndicator;
      contract.fundAssetType = this.readStr() as FundAssetType;
    }

    if (this.serverVersion >= MIN_SERVER_VER.INELIGIBILITY_REASONS) {
      const ineligibilityReasonCount = this.readInt();
      const ineligibilityReasonList = new Array<IneligibilityReason>();

      for (let i = 0; i < ineligibilityReasonCount; i++) {
        const id = this.readStr();
        const description = this.readStr();
        ineligibilityReasonList.push({ id, description });
      }
      contract.ineligibilityReasonList = ineligibilityReasonList;
    }

    this.emit(EventName.contractDetails, reqId, contract);
  }

  /**
   * Decode a EXECUTION_DATA message from data queue and emit a execDetails event.
   */
  private decodeMsg_EXECUTION_DATA(): void {
    let version = this.serverVersion;
    if (version < MIN_SERVER_VER.LAST_LIQUIDITY) {
      version = this.readInt();
    }

    let reqId = -1;
    if (version >= 7) {
      reqId = this.readInt();
    }

    const orderId = this.readInt();

    // read contract fields
    const contract: Contract = {};

    if (version >= 5) {
      contract.conId = this.readInt();
    }

    contract.symbol = this.readStr();
    contract.secType = this.readStr() as SecType;
    contract.lastTradeDateOrContractMonth = this.readStr();
    contract.strike = this.readDouble();
    contract.right = validateOptionType(this.readStr() as OptionType);

    if (version >= 9) {
      contract.multiplier = this.readDouble();
    }

    contract.exchange = this.readStr();
    contract.currency = this.readStr();
    contract.localSymbol = this.readStr();

    if (version >= 10) {
      contract.tradingClass = this.readStr();
    }

    const exec: Execution = {};

    exec.orderId = orderId;
    exec.execId = this.readStr();
    exec.time = this.readStr();
    exec.acctNumber = this.readStr();
    exec.exchange = this.readStr();
    exec.side = this.readStr();
    exec.shares = this.readDecimal();
    exec.price = this.readDouble();

    if (version >= 2) {
      exec.permId = this.readInt();
    }

    if (version >= 3) {
      exec.clientId = this.readInt();
    }

    if (version >= 4) {
      exec.liquidation = this.readInt();
    }

    if (version >= 6) {
      exec.cumQty = this.readDecimal();
      exec.avgPrice = this.readDouble();
    }

    if (version >= 8) {
      exec.orderRef = this.readStr();
    }

    if (version >= 9) {
      exec.evRule = this.readStr();
      exec.evMultiplier = this.readDouble();
    }

    if (this.serverVersion >= MIN_SERVER_VER.MODELS_SUPPORT) {
      exec.modelCode = this.readStr();
    }

    if (this.serverVersion >= MIN_SERVER_VER.LAST_LIQUIDITY) {
      exec.lastLiquidity = this.readInt();
    }

    if (this.serverVersion >= MIN_SERVER_VER.PENDING_PRICE_REVISION) {
      exec.pendingPriceRevision = this.readBool();
    }

    this.emit(EventName.execDetails, reqId, contract, exec);
  }

  /**
   * Decode a MARKET_DEPTH message from data queue and emit a MarketDepth event.
   */
  private decodeMsg_MARKET_DEPTH(): void {
    this.readInt(); // version
    const id = this.readInt();
    const position = this.readInt();
    const operation = this.readInt();
    const side = this.readInt();
    const price = this.readDouble();
    const size = this.readDecimal();

    this.emit(
      EventName.updateMktDepth,
      id,
      position,
      operation,
      side,
      price,
      size,
    );
  }

  /**
   * Decode a MARKET_DEPTH_L2 message from data queue and emit a MarketDepthL2 event.
   */
  private decodeMsg_MARKET_DEPTH_L2(): void {
    this.readInt(); // version
    const id = this.readInt();
    const position = this.readInt();
    const marketMaker = this.readStr();
    const operation = this.readInt();
    const side = this.readInt();
    const price = this.readDouble();
    const size = this.readDecimal();

    let isSmartDepth = undefined;
    if (this.serverVersion >= MIN_SERVER_VER.SMART_DEPTH) {
      isSmartDepth = this.readBool();
    }

    this.emit(
      EventName.updateMktDepthL2,
      id,
      position,
      marketMaker,
      operation,
      side,
      price,
      size,
      isSmartDepth,
    );
  }

  /**
   * Decode a NEWS_BULLETINS message from data queue and emit a updateNewsBulletin event.
   */
  private decodeMsg_NEWS_BULLETINS(): void {
    this.readInt(); // version
    const newsMsgId = this.readInt();
    const newsMsgType = this.readInt();
    const newsMessage = this.readStr();
    const originatingExch = this.readStr();

    this.emit(
      EventName.updateNewsBulletin,
      newsMsgId,
      newsMsgType,
      newsMessage,
      originatingExch,
    );
  }

  /**
   * Decode a MANAGED_ACCTS message from data queue and emit a managedAccounts event.
   */
  private decodeMsg_MANAGED_ACCTS(): void {
    this.readInt(); // version
    const accountsList = this.readStr();

    this.emit(EventName.managedAccounts, accountsList);
  }

  /**
   * Decode a RECEIVE_FA message from data queue and emit a receiveFA event.
   */
  private decodeMsg_RECEIVE_FA(): void {
    this.readInt(); // version
    const faDataType = this.readInt();
    const xml = this.readStr();

    this.emit(EventName.receiveFA, faDataType, xml);
  }

  /**
   * Decode a HISTORICAL_DATA message from data queue and emit historicalData events.
   */
  private decodeMsg_HISTORICAL_DATA(): void {
    let version = Number.MAX_SAFE_INTEGER;
    if (this.serverVersion < MIN_SERVER_VER.SYNT_REALTIME_BARS) {
      version = this.readInt();
    }

    const reqId = this.readInt();

    let completedIndicator = "finished";
    let startDateStr = "";
    let endDateStr = "";
    if (version >= 2) {
      startDateStr = this.readStr();
      endDateStr = this.readStr();
      completedIndicator += "-" + startDateStr + "-" + endDateStr;
    }

    let itemCount = this.readInt();

    while (itemCount--) {
      const date = this.readStr();
      const open = this.readDouble();
      const high = this.readDouble();
      const low = this.readDouble();
      const close = this.readDouble();
      const volume = this.readDecimal();
      const WAP = this.readDecimal();
      // TODO: hasGap is deprecated, we should readStr and ignore result
      let hasGaps: boolean | undefined = undefined;
      if (this.serverVersion < MIN_SERVER_VER.SYNT_REALTIME_BARS) {
        hasGaps = this.readBool();
      }

      let barCount: number | undefined = undefined;
      if (version >= 3) {
        barCount = this.readInt();
      }

      this.emit(
        EventName.historicalData,
        reqId,
        date,
        open,
        high,
        low,
        close,
        volume,
        barCount,
        WAP,
        hasGaps,
      );
    }

    // send end of dataset marker
    this.emit(
      EventName.historicalData,
      reqId,
      completedIndicator,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      false,
    );
  }

  /**
   * Decode a HISTORICAL_DATA_UPDATE message from data queue and emit historicalDataUpdate events.
   */
  private decodeMsg_HISTORICAL_DATA_UPDATE(): void {
    const reqId = this.readInt();
    const barCount = this.readInt();
    const date = this.readStr();
    const open = this.readDouble();
    const close = this.readDouble();
    const high = this.readDouble();
    const low = this.readDouble();
    const WAP = this.readDecimal();
    const volume = this.readDecimal();
    this.emit(
      EventName.historicalDataUpdate,
      reqId,
      date,
      open,
      high,
      low,
      close,
      volume,
      barCount,
      WAP,
    );
  }

  /**
   * Decode a REROUTE_MKT_DATA message from data queue and emit a rerouteMktDataReq event.
   */
  private decodeMsg_REROUTE_MKT_DATA(): void {
    const reqId = this.readInt();
    const conId = this.readInt();
    const exchange = this.readStr();
    this.emit(EventName.rerouteMktDataReq, reqId, conId, exchange);
  }

  /**
   * Decode a REROUTE_MKT_DEPTH message from data queue and emit a rerouteMktDepthReq event.
   */
  private decodeMsg_REROUTE_MKT_DEPTH(): void {
    const reqId = this.readInt();
    const conId = this.readInt();
    const exchange = this.readStr();
    this.emit(EventName.rerouteMktDepthReq, reqId, conId, exchange);
  }

  /**
   * Decode a MARKET_RULE message from data queue and emit a marketRule event.
   */
  private decodeMsg_MARKET_RULE(): void {
    const marketRuleId = this.readInt();
    const nPriceIncrements = this.readInt();
    const priceIncrements = new Array<PriceIncrement>(nPriceIncrements);

    for (let i = 0; i < nPriceIncrements; i++) {
      priceIncrements[i] = {
        lowEdge: this.readDouble(),
        increment: this.readDouble(),
      };
    }

    this.emit(EventName.marketRule, marketRuleId, priceIncrements);
  }

  /**
   * Decode a BOND_CONTRACT_DATA message from data queue and emit a BondContractData event.
   */
  private decodeMsg_BOND_CONTRACT_DATA(): void {
    let version = 6;
    if (this.serverVersion < MIN_SERVER_VER.SIZE_RULES) {
      version = this.readInt();
    }

    let reqId = -1;
    if (version >= 3) {
      reqId = this.readInt();
    }

    const contract: ContractDetails = {
      contract: {},
    };

    contract.contract.symbol = this.readStr();
    contract.contract.secType = this.readStr() as SecType;
    contract.cusip = this.readStr();
    contract.coupon = this.readDouble();
    this.readLastTradeDate(contract, true);
    contract.issueDate = this.readStr();
    contract.ratings = this.readStr();
    contract.bondType = this.readStr();
    contract.couponType = this.readStr();
    contract.convertible = this.readBool();
    contract.callable = this.readBool();
    contract.putable = this.readBool();
    contract.descAppend = this.readStr();
    contract.contract.exchange = this.readStr();
    contract.contract.currency = this.readStr();
    contract.marketName = this.readStr();
    contract.contract.tradingClass = this.readStr();
    contract.contract.conId = this.readInt();
    contract.minTick = this.readDouble();
    if (
      this.serverVersion >= MIN_SERVER_VER.MD_SIZE_MULTIPLIER &&
      this.serverVersion < MIN_SERVER_VER.SIZE_RULES
    ) {
      this.readInt(); // mdSizeMultiplier - not used anymore
    }
    contract.orderTypes = this.readStr();
    contract.validExchanges = this.readStr();

    if (version >= 2) {
      contract.nextOptionDate = this.readStr();
      contract.nextOptionType = this.readStr();
      contract.nextOptionPartial = this.readBool();
      contract.notes = this.readStr();
    }

    if (version >= 4) {
      contract.longName = this.readStr();
    }

    if (this.serverVersion >= MIN_SERVER_VER.BOND_TRADING_HOURS) {
      contract.timeZoneId = this.readStr();
      contract.tradingHours = this.readStr();
      contract.liquidHours = this.readStr();
    }

    if (version >= 6) {
      contract.evRule = this.readStr();
      contract.evMultiplier = this.readDouble();
    }

    if (version >= 5) {
      let secIdListCount = this.readInt();
      if (secIdListCount > 0) {
        contract.secIdList = [];
        while (secIdListCount--) {
          const tagValue: TagValue = {
            tag: this.readStr(),
            value: this.readStr(),
          };
          contract.secIdList.push(tagValue);
        }
      }
    }

    if (this.serverVersion >= MIN_SERVER_VER.AGG_GROUP) {
      contract.aggGroup = this.readInt();
    }

    if (this.serverVersion >= MIN_SERVER_VER.MARKET_RULES) {
      contract.marketRuleIds = this.readStr();
    }
    if (this.serverVersion >= MIN_SERVER_VER.SIZE_RULES) {
      contract.minSize = this.readDecimal();
      contract.sizeIncrement = this.readDecimal();
      contract.suggestedSizeIncrement = this.readDecimal();
    }

    this.emit(EventName.bondContractDetails, reqId, contract);
  }

  /**
   * Decode a SCANNER_PARAMETERS message from data queue and emit a scannerParameters event.
   */
  private decodeMsg_SCANNER_PARAMETERS(): void {
    const _version = this.readInt();
    const xml = this.readStr();

    this.emit(EventName.scannerParameters, xml);
  }

  /**
   * Decode a SCANNER_DATA message from data queue and emit a scannerData and scannerDataEnd event.
   */
  private decodeMsg_SCANNER_DATA(): void {
    const version = this.readInt();
    const reqId = this.readInt();
    let numberOfElements = this.readInt();

    while (numberOfElements--) {
      const contract: ContractDetails = {
        contract: {},
      };

      const rank = this.readInt();
      if (version >= 3) {
        contract.contract.conId = this.readInt();
      }

      contract.contract.symbol = this.readStr();
      contract.contract.secType = this.readStr() as SecType;
      this.readLastTradeDate(contract, false);
      contract.contract.strike = this.readDouble();
      contract.contract.right = validateOptionType(
        this.readStr() as OptionType,
      );
      contract.contract.exchange = this.readStr();
      contract.contract.currency = this.readStr();
      contract.contract.localSymbol = this.readStr();
      contract.marketName = this.readStr();
      contract.contract.tradingClass = this.readStr();

      const distance = this.readStr();
      const benchmark = this.readStr();
      const projection = this.readStr();

      let legsStr: string | undefined = undefined;
      if (version >= 2) {
        legsStr = this.readStr();
      }

      this.emit(
        EventName.scannerData,
        reqId,
        rank,
        contract,
        distance,
        benchmark,
        projection,
        legsStr,
      );
    }

    this.emit(EventName.scannerDataEnd, reqId);
  }

  /**
   * Decode a TICK_OPTION_COMPUTATION message from data queue and emit a tickOptionComputation event.
   */
  private decodeMsg_TICK_OPTION_COMPUTATION(): void {
    const version =
      this.serverVersion >= MIN_SERVER_VER.PRICE_BASED_VOLATILITY
        ? Number.MAX_VALUE
        : this.readInt();

    const tickerId = this.readInt();
    const tickType = this.readInt();

    let _tickAttrib;
    if (this.serverVersion >= MIN_SERVER_VER.PRICE_BASED_VOLATILITY) {
      _tickAttrib = this.readInt();
    }

    let impliedVol = this.readDouble();
    if (impliedVol == -1) {
      // -1 is the "not yet computed" indicator
      impliedVol = undefined;
    }

    let delta = this.readDouble();
    if (delta == -2) {
      // -2 is the "not yet computed" indicator
      delta = undefined;
    }

    let optPrice: number | undefined = undefined;
    let pvDividend: number | undefined = undefined;
    let gamma: number | undefined = undefined;
    let vega: number | undefined = undefined;
    let theta: number | undefined = undefined;
    let undPrice: number | undefined = undefined;

    if (
      version >= 6 ||
      tickType === TickType.MODEL_OPTION ||
      tickType === TickType.DELAYED_MODEL_OPTION
    ) {
      optPrice = this.readDouble();
      if (optPrice == -1) {
        // -1 is the "not yet computed" indicator
        optPrice = undefined;
      }

      pvDividend = this.readDouble();
      if (pvDividend == -1) {
        // -1 is the "not yet computed" indicator
        pvDividend = undefined;
      }
    }

    if (version >= 6) {
      gamma = this.readDouble();
      if (gamma == -2) {
        // -2 is the "not yet computed" indicator
        gamma = undefined;
      }

      vega = this.readDouble();
      if (vega == -2) {
        // -2 is the "not yet computed" indicator
        vega = undefined;
      }

      theta = this.readDouble();
      if (theta == -2) {
        // -2 is the "not yet computed" indicator
        theta = undefined;
      }

      undPrice = this.readDouble();
      if (undPrice == -1) {
        // -1 is the "not yet computed" indicator
        undPrice = undefined;
      }
    }

    this.emit(
      EventName.tickOptionComputation,
      tickerId,
      tickType,
      // tickAttrib,	0 - return based, 1- price based. Ignored
      impliedVol,
      delta,
      optPrice,
      pvDividend,
      gamma,
      vega,
      theta,
      undPrice,
    );
  }

  /**
   * Decode a TICK_GENERIC message from data queue and emit a tickGeneric event.
   */
  private decodeMsg_TICK_GENERIC(): void {
    this.readInt(); // version
    const tickerId = this.readInt();
    const tickType = this.readInt();
    const value = this.readDouble();

    this.emit(EventName.tickGeneric, tickerId, tickType, value);
  }

  /**
   * Decode a TICK_STRING message from data queue and emit a tickString event.
   */
  private decodeMsg_TICK_STRING(): void {
    this.readInt(); // version
    const tickerId = this.readInt();
    const tickType = this.readInt();
    const value = this.readStr();

    this.emit(EventName.tickString, tickerId, tickType, value);
  }

  /**
   * Decode a TICK_EFP message from data queue and emit a tickEFP event.
   */
  private decodeMsg_TICK_EFP(): void {
    this.readInt(); // version
    const tickerId = this.readInt();
    const tickType = this.readInt();
    const basisPoints = this.readDouble();
    const formattedBasisPoints = this.readStr();
    const impliedFuturesPrice = this.readDouble();
    const holdDays = this.readInt();
    const futureExpiry = this.readStr();
    const dividendImpact = this.readDouble();
    const dividendsToExpiry = this.readDouble();

    this.emit(
      EventName.tickEFP,
      tickerId,
      tickType,
      basisPoints,
      formattedBasisPoints,
      impliedFuturesPrice,
      holdDays,
      futureExpiry,
      dividendImpact,
      dividendsToExpiry,
    );
  }

  /**
   * Decode a CURRENT_TIME message from data queue and emit a currentTime event.
   */
  private decodeMsg_CURRENT_TIME(): void {
    this.readInt(); //  version
    const time = this.readInt();

    this.emit(EventName.currentTime, time);
  }

  /**
   * Decode a REAL_TIME_BARS message from data queue and emit a realtimeBars event.
   */
  private decodeMsg_REAL_TIME_BARS(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const time = this.readInt();
    const open = this.readDouble();
    const high = this.readDouble();
    const low = this.readDouble();
    const close = this.readDouble();
    const volume = this.readDecimal();
    const wap = this.readDecimal();
    const count = this.readInt();

    this.emit(
      EventName.realtimeBar,
      reqId,
      time,
      open,
      high,
      low,
      close,
      volume,
      wap,
      count,
    );
  }

  /**
   * Decode a REAL_TIME_BARS message from data queue and emit a fundamentalData event.
   */
  private decodeMsg_FUNDAMENTAL_DATA(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const data = this.readStr();

    this.emit(EventName.fundamentalData, reqId, data);
  }

  /**
   * Decode a CONTRACT_DATA_END message from data queue and emit a contractDetailsEnd event.
   */
  private decodeMsg_CONTRACT_DATA_END(): void {
    this.readInt(); // version
    const reqId = this.readInt();

    this.emit(EventName.contractDetailsEnd, reqId);
  }

  /**
   * Decode a OPEN_ORDER_END message from data queue and emit a openOrderEnd event.
   */
  private decodeMsg_OPEN_ORDER_END(): void {
    this.readInt(); // version

    this.emit(EventName.openOrderEnd);
  }

  /**
   * Decode a ACCT_DOWNLOAD_END  message from data queue and emit a accountDownloadEnd event.
   */
  private decodeMsg_ACCT_DOWNLOAD_END(): void {
    this.readInt(); // version
    const accountName = this.readStr();

    this.emit(EventName.accountDownloadEnd, accountName);
  }

  /**
   * Decode a EXECUTION_DATA_END  message from data queue and emit a execDetailsEnd event.
   */
  private decodeMsg_EXECUTION_DATA_END(): void {
    this.readInt(); // version
    const reqId = this.readInt();

    this.emit(EventName.execDetailsEnd, reqId);
  }

  /**
   * Decode a DELTA_NEUTRAL_VALIDATION message from data queue and emit a deltaNeutralValidation event.
   */
  private decodeMsg_DELTA_NEUTRAL_VALIDATION(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const underComp: DeltaNeutralContract = {
      conId: this.readInt(),
      delta: this.readDouble(),
      price: this.readDouble(),
    };

    this.emit(EventName.deltaNeutralValidation, reqId, underComp);
  }

  /**
   * Decode a TICK_SNAPSHOT_END message from data queue and emit a tickSnapshotEnd event.
   */
  private decodeMsg_TICK_SNAPSHOT_END(): void {
    this.readInt(); // version
    const reqId = this.readInt();

    this.emit(EventName.tickSnapshotEnd, reqId);
  }

  /**
   * Decode a MARKET_DATA_TYPE message from data queue and emit a marketDataType event.
   */
  private decodeMsg_MARKET_DATA_TYPE(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const marketDataType = this.readInt();

    this.emit(EventName.marketDataType, reqId, marketDataType);
  }

  /**
   * Decode a COMMISSION_REPORT message from data queue and emit a commissionReport event.
   */
  private decodeMsg_COMMISSION_REPORT(): void {
    this.readInt(); // version

    const commissionReport: CommissionReport = {};
    commissionReport.execId = this.readStr();
    commissionReport.commission = this.readDouble();
    commissionReport.currency = this.readStr();
    commissionReport.realizedPNL = this.readDouble();
    commissionReport.yield = this.readDouble();
    commissionReport.yieldRedemptionDate = this.readInt();

    this.emit(EventName.commissionReport, commissionReport);
  }

  /**
   * Decode a POSITION message from data queue and emit a position event.
   */
  private decodeMsg_POSITION(): void {
    const version = this.readInt();
    const account = this.readStr();
    const contract: Contract = {};

    contract.conId = this.readInt();
    contract.symbol = this.readStr();
    contract.secType = this.readStr() as SecType;
    contract.lastTradeDateOrContractMonth = this.readStr();
    contract.strike = this.readDouble();
    contract.right = validateOptionType(this.readStr() as OptionType);
    contract.multiplier = this.readDouble();
    contract.exchange = this.readStr();
    contract.currency = this.readStr();
    contract.localSymbol = this.readStr();
    if (version >= 2) {
      contract.tradingClass = this.readStr();
    }

    const pos = this.readDecimal();

    let avgCost = 0;
    if (version >= 3) {
      avgCost = this.readDouble();
    }

    this.emit(EventName.position, account, contract, pos, avgCost);
  }

  /**
   * Decode a POSITION_END message from data queue and emit a positionEnd event.
   */
  private decodeMsg_POSITION_END(): void {
    this.readInt(); // version

    this.emit(EventName.positionEnd);
  }

  /**
   * Decode a ACCOUNT_SUMMARY message from data queue and emit a accountSummary event.
   */
  private decodeMsg_ACCOUNT_SUMMARY(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const account = this.readStr();
    const tag = this.readStr();
    const value = this.readStr();
    const currency = this.readStr();

    this.emit(EventName.accountSummary, reqId, account, tag, value, currency);
  }

  /**
   * Decode a ACCOUNT_SUMMARY message from data queue and emit a accountSummaryEnd event.
   */
  private decodeMsg_ACCOUNT_SUMMARY_END(): void {
    this.readInt(); // version
    const reqId = this.readInt();

    this.emit(EventName.accountSummaryEnd, reqId);
  }

  /**
   * Decode a DISPLAY_GROUP_LIST message from data queue and emit a displayGroupList event.
   */
  private decodeMsg_DISPLAY_GROUP_LIST(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const list = this.readStr();

    this.emit(EventName.displayGroupList, reqId, list);
  }

  /**
   * Decode a DISPLAY_GROUP_UPDATED message from data queue and emit a displayGroupUpdated event.
   */
  private decodeMsg_DISPLAY_GROUP_UPDATED(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const contractInfo = this.readStr();

    this.emit(EventName.displayGroupUpdated, reqId, contractInfo);
  }

  /**
   * Decode a POSITION_MULTI message from data queue and emit a PositionMulti event.
   */
  private decodeMsg_POSITION_MULTI(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const account = this.readStr();
    const contract: Contract = {};

    contract.conId = this.readInt();
    contract.symbol = this.readStr();
    contract.secType = this.readStr() as SecType;
    contract.lastTradeDateOrContractMonth = this.readStr();
    contract.strike = this.readDouble();
    contract.right = validateOptionType(this.readStr() as OptionType);
    contract.multiplier = this.readDouble();
    contract.exchange = this.readStr();
    contract.currency = this.readStr();
    contract.localSymbol = this.readStr();
    contract.tradingClass = this.readStr();
    const pos = this.readDecimal();
    const avgCost = this.readDouble();
    const modelCode = this.readStr();

    this.emit(
      EventName.positionMulti,
      reqId,
      account,
      modelCode,
      contract,
      pos,
      avgCost,
    );
  }

  /**
   * Decode a POSITION_MULTI_END message from data queue and emit a positionMultiEnd event.
   */
  private decodeMsg_POSITION_MULTI_END(): void {
    this.readInt(); // version
    const reqId = this.readInt();

    this.emit(EventName.positionMultiEnd, reqId);
  }

  /**
   * Decode a ACCOUNT_UPDATE_MULTI message from data queue and emit a accountUpdateMulti event.
   */
  private decodeMsg_ACCOUNT_UPDATE_MULTI(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const account = this.readStr();
    const modelCode = this.readStr();
    const key = this.readStr();
    const value = this.readStr();
    const currency = this.readStr();

    this.emit(
      EventName.accountUpdateMulti,
      reqId,
      account,
      modelCode,
      key,
      value,
      currency,
    );
  }

  /**
   * Decode a ACCOUNT_UPDATE_MULTI_END message from data queue and emit a accountUpdateMultiEnd event.
   */
  private decodeMsg_ACCOUNT_UPDATE_MULTI_END(): void {
    this.readInt(); // version
    const reqId = this.readStr();

    this.emit(EventName.accountUpdateMultiEnd, reqId);
  }

  /**
   * Decode a SECURITY_DEFINITION_OPTION_PARAMETER message from data queue and emit a securityDefinitionOptionParameter event.
   */
  private decodeMsg_SECURITY_DEFINITION_OPTION_PARAMETER(): void {
    const reqId = this.readInt();
    const exchange = this.readStr();
    const underlyingConId = this.readInt();
    const tradingClass = this.readStr();
    const multiplier = this.readDouble();
    const expCount = this.readInt();
    const expirations: unknown[] = [];

    for (let i = 0; i < expCount; i++) {
      expirations.push(this.readStr());
    }

    const strikeCount = this.readInt();
    const strikes: number[] = [];
    for (let j = 0; j < strikeCount; j++) {
      strikes.push(this.readDouble());
    }

    this.emit(
      EventName.securityDefinitionOptionParameter,
      reqId,
      exchange,
      underlyingConId,
      tradingClass,
      multiplier,
      expirations,
      strikes,
    );
  }

  /**
   * Decode a SECURITY_DEFINITION_OPTION_PARAMETER_END message from data queue and emit a securityDefinitionOptionParameterEnd event.
   */
  private decodeMsg_SECURITY_DEFINITION_OPTION_PARAMETER_END(): void {
    const reqId = this.readInt();

    this.emit(EventName.securityDefinitionOptionParameterEnd, reqId);
  }

  /**
   * Decode a SOFT_DOLLAR_TIERS message from data queue and emit a softDollarTiers event.
   */
  private decodeMsg_SOFT_DOLLAR_TIERS(): void {
    const reqId = this.readInt();
    const nTiers = this.readInt();

    const tiers: SoftDollarTier[] = new Array(nTiers);
    for (let i = 0; i < nTiers; i++) {
      tiers[i] = {
        name: this.readStr(),
        value: this.readStr(),
        displayName: this.readStr(),
      };
    }

    this.emit(EventName.softDollarTiers, reqId, tiers);
  }

  /**
   * Decode a FAMILY_CODES message from data queue and emit a familyCodes event.
   */
  private decodeMsg_FAMILY_CODES(): void {
    const nFamilyCodes = this.readInt();

    const familyCodes: FamilyCode[] = new Array(nFamilyCodes);
    for (let i = 0; i < nFamilyCodes; i++) {
      familyCodes[i] = {
        accountID: this.readStr(),
        familyCode: this.readStr(),
      };
    }

    this.emit(EventName.familyCodes, familyCodes);
  }

  /**
   * Decode a SYMBOL_SAMPLES message from data queue and emit a symbolSamples event.
   */
  private decodeMsg_SYMBOL_SAMPLES(): void {
    const reqId = this.readInt();

    const nContractDescriptions = this.readInt();
    const contractDescriptions: ContractDescription[] = new Array(
      nContractDescriptions,
    );
    for (let i = 0; i < nContractDescriptions; i++) {
      const contract: Contract = {
        conId: this.readInt(),
        symbol: this.readStr(),
        secType: this.readStr() as SecType,
        primaryExch: this.readStr(),
        currency: this.readStr(),
      };

      const nDerivativeSecTypes = this.readInt();
      const derivativeSecTypes: SecType[] = new Array(nDerivativeSecTypes);
      for (let j = 0; j < nDerivativeSecTypes; j++) {
        derivativeSecTypes[j] = this.readStr() as SecType;
      }

      if (this.serverVersion >= MIN_SERVER_VER.BOND_ISSUERID) {
        contract.description = this.readStr();
        contract.issuerId = this.readStr();
      }

      contractDescriptions[i] = {
        contract: contract,
        derivativeSecTypes: derivativeSecTypes,
      };
    }

    this.emit(EventName.symbolSamples, reqId, contractDescriptions);
  }

  /**
   * Decode a MKT_DEPTH_EXCHANGES message from data queue and emit a mktDepthExchanges event.
   */
  private decodeMsg_MKT_DEPTH_EXCHANGES(): void {
    const nDepthMktDataDescriptions = this.readInt();
    const depthMktDataDescriptions: DepthMktDataDescription[] = new Array(
      nDepthMktDataDescriptions,
    );
    for (let i = 0; i < nDepthMktDataDescriptions; i++) {
      if (this.serverVersion >= MIN_SERVER_VER.SERVICE_DATA_TYPE) {
        depthMktDataDescriptions[i] = {
          exchange: this.readStr(),
          secType: this.readStr() as SecType,
          listingExch: this.readStr(),
          serviceDataType: this.readStr(),
          aggGroup: this.readIntOrUndefined(),
        };
      } else {
        depthMktDataDescriptions[i] = {
          exchange: this.readStr(),
          secType: this.readStr() as SecType,
          listingExch: "",
          serviceDataType: this.readBool() ? "Deep2" : "Deep",
          aggGroup: undefined,
        };
      }
    }

    this.emit(EventName.mktDepthExchanges, depthMktDataDescriptions);
  }

  /**
   * Decode a TICK_REQ_PARAMS message from data queue and emit a tickReqParams event.
   */
  private decodeMsg_TICK_REQ_PARAMS(): void {
    const tickerId = this.readInt();
    const minTick = this.readInt();
    const bboExchange = this.readStr();
    const snapshotPermissions = this.readInt();

    this.emit(
      EventName.tickReqParams,
      tickerId,
      minTick,
      bboExchange,
      snapshotPermissions,
    );
  }

  /**
   * Decode a SMART_COMPONENTS message from data queue and emit a smartComponents event.
   */
  private decodeMsg_SMART_COMPONENTS(): void {
    const reqId = this.readInt();
    const nCount = this.readInt();

    const theMap: Map<number, [string, string]> = new Map<
      number,
      [string, string]
    >();
    for (let i = 0; i < nCount; i++) {
      const bitNumber = this.readInt();
      const exchange = this.readStr();
      const exchangeLetter = this.readStr();
      theMap.set(bitNumber, [exchange, exchangeLetter]);
    }

    this.emit(EventName.smartComponents, reqId, theMap);
  }

  /**
   * Decode a NEWS_ARTICLE message from data queue and emit a newsArticle event.
   */
  private decodeMsg_NEWS_ARTICLE(): void {
    const reqId = this.readInt();
    const articleType = this.readInt();
    const articleText = this.readStr();

    this.emit(EventName.newsArticle, reqId, articleType, articleText);
  }

  /**
   * Decode a TICK_NEWS message from data queue and emit a tickNews event.
   */
  private decodeMsg_TICK_NEWS(): void {
    const tickerId = this.readInt();
    const timeStamp = this.readInt();
    const providerCode = this.readStr();
    const articleId = this.readStr();
    const headline = this.readStr();
    const extraData = this.readStr();

    this.emit(
      EventName.tickNews,
      tickerId,
      timeStamp,
      providerCode,
      articleId,
      headline,
      extraData,
    );
  }

  /**
   * Decode a NEWS_PROVIDERS message from data queue and emit a newsProviders event.
   */
  private decodeMsg_NEWS_PROVIDERS(): void {
    const nNewsProviders = this.readInt();
    const newProviders: NewsProvider[] = new Array(nNewsProviders);
    for (let i = 0; i < nNewsProviders; i++) {
      newProviders[i] = {
        providerCode: this.readStr(),
        providerName: this.readStr(),
      };
    }

    this.emit(EventName.newsProviders, newProviders);
  }

  /**
   * Decode a HISTORICAL_NEWS message from data queue and emit a historicalNews event.
   */
  private decodeMsg_HISTORICAL_NEWS(): void {
    const requestId = this.readInt();
    const time = this.readStr();
    const providerCode = this.readStr();
    const articleId = this.readStr();
    const headline = this.readStr();

    this.emit(
      EventName.historicalNews,
      requestId,
      time,
      providerCode,
      articleId,
      headline,
    );
  }

  /**
   * Decode a HISTORICAL_NEWS_END message from data queue and emit a historicalNewsEnd event.
   */
  private decodeMsg_HISTORICAL_NEWS_END(): void {
    const reqId = this.readInt();
    const hasMore = this.readBool();

    this.emit(EventName.historicalNewsEnd, reqId, hasMore);
  }

  /**
   * Decode a HEAD_TIMESTAMP message from data queue and emit a headTimestamp event.
   */
  private decodeMsg_HEAD_TIMESTAMP(): void {
    const reqId = this.readInt();
    const headTimestamp = this.readStr();

    this.emit(EventName.headTimestamp, reqId, headTimestamp);
  }

  /**
   * Decode a HISTOGRAM_DATA message from data queue and emit a histogramData event.
   */
  private decodeMsg_HISTOGRAM_DATA(): void {
    const reqId = this.readInt();
    const count = this.readInt();

    const items: HistogramEntry[] = new Array(count);
    for (let i = 0; i < count; i++) {
      items[i] = {
        price: this.readDouble(),
        size: this.readDecimal(),
      };
    }

    this.emit(EventName.histogramData, reqId, items);
  }

  /**
   * Decode a PNL message from data queue and emit a pnl event.
   */
  private decodeMsg_PNL(): void {
    const reqId = this.readInt();
    const dailyPnL = this.readDouble();

    let unrealizedPnL: number | undefined = undefined;
    let realizedPnL: number | undefined = undefined;

    if (this.serverVersion >= MIN_SERVER_VER.UNREALIZED_PNL) {
      unrealizedPnL = this.readDouble();
    }
    if (this.serverVersion >= MIN_SERVER_VER.REALIZED_PNL) {
      realizedPnL = this.readDouble();
    }

    this.emit(EventName.pnl, reqId, dailyPnL, unrealizedPnL, realizedPnL);
  }

  /**
   * Decode a PNL_SINGLE message from data queue and emit a pnlSingle event.
   */
  private decodeMsg_PNL_SINGLE(): void {
    const reqId = this.readInt();
    const pos = this.readDecimal();
    const dailyPnL = this.readDouble();

    let unrealizedPnL: number | undefined = undefined;
    let realizedPnL: number | undefined = undefined;

    if (this.serverVersion >= MIN_SERVER_VER.UNREALIZED_PNL) {
      unrealizedPnL = this.readDouble();
    }
    if (this.serverVersion >= MIN_SERVER_VER.REALIZED_PNL) {
      realizedPnL = this.readDouble();
    }

    const value = this.readDouble();

    this.emit(
      EventName.pnlSingle,
      reqId,
      pos,
      dailyPnL,
      unrealizedPnL,
      realizedPnL,
      value,
    );
  }

  /**
   * Decode a HISTORICAL_TICKS message from data queue and emit a historicalTicks event.
   */
  private decodeMsg_HISTORICAL_TICKS(): void {
    const reqId = this.readInt();
    const tickCount = this.readInt();
    const ticks: HistoricalTick[] = new Array(tickCount);
    for (let i = 0; i < tickCount; i++) {
      const time = this.readInt();
      this.readInt(); //for consistency
      const price = this.readDouble();
      const size = this.readDecimal();
      ticks[i] = {
        time,
        price,
        size,
      };
    }
    const done = this.readBool();

    this.emit(EventName.historicalTicks, reqId, ticks, done);
  }

  /**
   * Decode a HISTORICAL_TICKS_BID_ASK message from data queue and emit a historicalTicksBidAsk event.
   */
  private decodeMsg_HISTORICAL_TICKS_BID_ASK(): void {
    const reqId = this.readInt();
    const tickCount = this.readInt();
    const ticks: HistoricalTickBidAsk[] = new Array(tickCount);
    for (let i = 0; i < tickCount; i++) {
      const time = this.readInt();
      const flags = this.readInt();
      const priceBid = this.readDouble();
      const priceAsk = this.readDouble();
      const sizeBid = this.readDecimal();
      const sizeAsk = this.readDecimal();
      ticks[i] = {
        time: time,
        tickAttribBidAsk: {
          bidPastLow: (flags & (1 << 0)) != 0,
          askPastHigh: (flags & (1 << 1)) != 0,
        },
        priceBid: priceBid,
        priceAsk: priceAsk,
        sizeBid: sizeBid,
        sizeAsk: sizeAsk,
      };
    }
    const done = this.readBool();

    this.emit(EventName.historicalTicksBidAsk, reqId, ticks, done);
  }

  /**
   * Decode a HISTORICAL_TICKS_LAST message from data queue and emit a historicalTicksLast event.
   */
  private decodeMsg_HISTORICAL_TICKS_LAST(): void {
    const reqId = this.readInt();
    const tickCount = this.readInt();
    const ticks: HistoricalTickLast[] = new Array(tickCount);
    for (let i = 0; i < tickCount; i++) {
      const time = this.readInt();
      const mask = this.readInt();
      const price = this.readDouble();
      const size = this.readDecimal();
      const exchange = this.readStr();
      const specialConditions = this.readStr();
      ticks[i] = {
        time: time,
        tickAttribLast: {
          pastLimit: (mask & (1 << 0)) !== 0,
          unreported: (mask & (1 << 1)) !== 0,
        },
        price: price,
        size: size,
        exchange: exchange,
        specialConditions: specialConditions,
      };
    }
    const done = this.readBool();

    this.emit(EventName.historicalTicksLast, reqId, ticks, done);
  }

  /**
   * Decode a TICK_BY_TICK message from data queue and a emit tickByTickAllLast, tickByTickBidAsk or tickByTickMidPoint event.
   */
  private decodeMsg_TICK_BY_TICK(): void {
    const reqId = this.readInt();
    const tickType = this.readInt();
    const time = this.readStr();

    switch (tickType) {
      case 0: // None
        break;
      case 1: // Last
      case 2: {
        // All-last
        const price = this.readDouble();
        const size = this.readDecimal();
        const mask = this.readInt();
        const pastLimit = (mask & (1 << 0)) !== 0;
        const unreported = (mask & (1 << 1)) !== 0;
        const exchange = this.readStr();
        const specialConditions = this.readStr();

        this.emit(
          EventName.tickByTickAllLast,
          reqId,
          tickType,
          time,
          price,
          size,
          { pastLimit, unreported },
          exchange,
          specialConditions,
        );
        break;
      }
      case 3: {
        // BidAsk
        const bidPrice = this.readDouble();
        const askPrice = this.readDouble();
        const bidSize = this.readDecimal();
        const askSize = this.readDecimal();
        const mask = this.readInt();
        const bidPastLow = (mask & (1 << 0)) !== 0;
        const askPastHigh = (mask & (1 << 1)) !== 0;

        this.emit(
          EventName.tickByTickBidAsk,
          reqId,
          time,
          bidPrice,
          askPrice,
          bidSize,
          askSize,
          {
            bidPastLow,
            askPastHigh,
          },
        );
        break;
      }
      case 4: {
        // MidPoint
        const midPoint = this.readDouble();

        this.emit(EventName.tickByTickMidPoint, reqId, time, midPoint);
        break;
      }
    }
  }

  /**
   * Decode a ORDER_BOUND message from data queue and a emit orderBound event.
   */
  private decodeMsg_ORDER_BOUND(): void {
    const permId = this.readInt();
    const clientId = this.readDouble();
    const orderId = this.readInt();

    this.emit(EventName.orderBound, permId, clientId, orderId);
  }

  /**
   * Decode a COMPLETED_ORDER message from data queue and a emit completedOrder event.
   */
  private decodeMsg_COMPLETED_ORDER(): void {
    const contract: Contract = {};
    const order: Order = {};
    const orderState: OrderState = {};
    const orderDecoder = new OrderDecoder(
      this,
      contract,
      order,
      orderState,
      Number.MAX_VALUE,
      this.serverVersion,
    );

    // read contract fields
    orderDecoder.readContractFields();

    // read order fields
    orderDecoder.readAction();
    orderDecoder.readTotalQuantity();
    orderDecoder.readOrderType();
    orderDecoder.readLmtPrice();
    orderDecoder.readAuxPrice();
    orderDecoder.readTIF();
    orderDecoder.readOcaGroup();
    orderDecoder.readAccount();
    orderDecoder.readOpenClose();
    orderDecoder.readOrigin();
    orderDecoder.readOrderRef();
    orderDecoder.readPermId();
    orderDecoder.readOutsideRth();
    orderDecoder.readHidden();
    orderDecoder.readDiscretionaryAmount();
    orderDecoder.readGoodAfterTime();
    orderDecoder.readFAParams();
    orderDecoder.readModelCode();
    orderDecoder.readGoodTillDate();
    orderDecoder.readRule80A();
    orderDecoder.readPercentOffset();
    orderDecoder.readSettlingFirm();
    orderDecoder.readShortSaleParams();
    orderDecoder.readBoxOrderParams();
    orderDecoder.readPegToStkOrVolOrderParams();
    orderDecoder.readDisplaySize();
    orderDecoder.readSweepToFill();
    orderDecoder.readAllOrNone();
    orderDecoder.readMinQty();
    orderDecoder.readOcaType();
    orderDecoder.readTriggerMethod();
    orderDecoder.readVolOrderParams(false);
    orderDecoder.readTrailParams();
    orderDecoder.readComboLegs();
    orderDecoder.readSmartComboRoutingParams();
    orderDecoder.readScaleOrderParams();
    orderDecoder.readHedgeParams();
    orderDecoder.readClearingParams();
    orderDecoder.readNotHeld();
    orderDecoder.readDeltaNeutral();
    orderDecoder.readAlgoParams();
    orderDecoder.readSolicited();
    orderDecoder.readOrderStatus();
    orderDecoder.readVolRandomizeFlags();
    orderDecoder.readPegToBenchParams();
    orderDecoder.readConditions();
    orderDecoder.readStopPriceAndLmtPriceOffset();
    orderDecoder.readCashQty();
    orderDecoder.readDontUseAutoPriceForHedge();
    orderDecoder.readIsOmsContainer();
    orderDecoder.readAutoCancelDate();
    orderDecoder.readFilledQuantity();
    orderDecoder.readRefFuturesConId();
    orderDecoder.readAutoCancelParent();
    orderDecoder.readShareholder();
    orderDecoder.readImbalanceOnly();
    orderDecoder.readRouteMarketableToBbo();
    orderDecoder.readParentPermId();
    orderDecoder.readCompletedTime();
    orderDecoder.readCompletedStatus();
    orderDecoder.readPegBestPegMidOrderAttributes();
    orderDecoder.readCustomerAccount();
    orderDecoder.readProfessionalCustomer();

    this.emit(EventName.completedOrder, contract, order, orderState);
  }

  /**
   * Decode a COMPLETED_ORDER_END message from data queue and a emit completedOrdersEnd event.
   */
  private decodeMsg_COMPLETED_ORDERS_END(): void {
    this.emit(EventName.completedOrdersEnd);
  }

  /**
   * Decode a REPLACE_FA_END message from data queue and a emit replaceFAEnd event.
   */
  private decodeMsg_REPLACE_FA_END(): void {
    const reqId = this.readInt();
    const text = this.readStr();
    this.emit(EventName.replaceFAEnd, reqId, text);
  }

  /**
   * Decode a WSH_META_DATA message from data queue and a emit wshMetaData event.
   */
  private decodeMsg_WSH_META_DATA(): void {
    const reqId = this.readInt();
    const dataJson = this.readStr();
    this.emit(EventName.wshMetaData, reqId, dataJson);
  }

  /**
   * Decode a WSH_EVENT_DATA message from data queue and a emit wshEventData event.
   */
  private decodeMsg_WSH_EVENT_DATA(): void {
    const reqId = this.readInt();
    const dataJson = this.readStr();
    this.emit(EventName.wshEventData, reqId, dataJson);
  }

  /**
   * Decode a HISTORICAL_SCHEDULE message from data queue and a emit historicalSchedule event.
   */
  private decodeMsg_HISTORICAL_SCHEDULE(): void {
    const reqId = this.readInt();
    const startDateTime = this.readStr();
    const endDateTime = this.readStr();
    const timeZone = this.readStr();

    const sessionsCount = this.readInt();
    const sessions: HistoricalSession[] = new Array(sessionsCount);

    for (let i = 0; i < sessionsCount; i++) {
      const sessionStartDateTime = this.readStr();
      const sessionEndDateTime = this.readStr();
      const sessionRefDate = this.readStr();
      sessions[i] = {
        startDateTime: sessionStartDateTime,
        endDateTime: sessionEndDateTime,
        refDate: sessionRefDate,
      };
    }

    this.emit(
      EventName.historicalSchedule,
      reqId,
      startDateTime,
      endDateTime,
      timeZone,
      sessions,
    );
  }

  /**
   * Decode a USER_INFO message from data queue and a emit userInfo event.
   */
  private decodeMsg_USER_INFO(): void {
    const reqId = this.readInt();
    const whiteBrandingId = this.readStr();

    this.emit(EventName.userInfo, reqId, whiteBrandingId);
  }

  /**
   * Read last trade date, parse it and assign to proper [[ContractDetails]] attributes.
   */
  private readLastTradeDate(contract: ContractDetails, isBond: boolean): void {
    const lastTradeDateOrContractMonth = this.readStr();
    if (lastTradeDateOrContractMonth.length) {
      const split =
        lastTradeDateOrContractMonth.indexOf("-") > 0
          ? lastTradeDateOrContractMonth.split("-")
          : lastTradeDateOrContractMonth.split("\\s+");

      if (split.length > 0) {
        if (isBond) {
          contract.maturity = split[0];
        } else {
          contract.contract.lastTradeDateOrContractMonth = split[0];
        }
      }

      if (split.length > 1) {
        contract.lastTradeTime = split[1];
      }

      if (isBond && split.length > 2) {
        contract.timeZoneId = split[2];
      }
    }
  }
}

/**
 * @internal
 *
 * This class implements the Order-decoder, similar to IB's EOrderDecoder on
 * https://github.com/stoqey/ib/blob/master/ref/client/EOrderDecoder.java
 */

class OrderDecoder {
  constructor(
    private decoder: Decoder,
    private contract: Contract,
    private order: Order,
    private orderState: OrderState,
    private version: number,
    private serverVersion: number,
  ) {}

  readOrderId(): void {
    this.order.orderId = this.decoder.readInt();
  }

  readContractFields(): void {
    if (this.version >= 17) {
      this.contract.conId = this.decoder.readInt();
    }
    this.contract.symbol = this.decoder.readStr();
    this.contract.secType = this.decoder.readStr() as SecType;
    this.contract.lastTradeDateOrContractMonth = this.decoder.readStr();
    this.contract.strike = this.decoder.readDouble();
    this.contract.right = validateOptionType(
      this.decoder.readStr() as OptionType,
    );
    if (this.version >= 32) {
      this.contract.multiplier = +this.decoder.readStr();
    }
    this.contract.exchange = this.decoder.readStr();
    this.contract.currency = this.decoder.readStr();
    if (this.version >= 2) {
      this.contract.localSymbol = this.decoder.readStr();
    }
    if (this.version >= 32) {
      this.contract.tradingClass = this.decoder.readStr();
    }
  }

  readAction(): void {
    this.order.action = this.decoder.readStr() as OrderAction;
  }

  readTotalQuantity(): void {
    this.order.totalQuantity = this.decoder.readDecimal();
  }

  readOrderType(): void {
    this.order.orderType = this.decoder.readStr() as OrderType;
  }

  readLmtPrice(): void {
    if (this.version < 29) {
      this.order.lmtPrice = this.decoder.readDouble();
    } else {
      this.order.lmtPrice = this.decoder.readDoubleOrUndefined();
    }
  }

  readAuxPrice(): void {
    if (this.version < 30) {
      this.order.auxPrice = this.decoder.readDouble();
    } else {
      this.order.auxPrice = this.decoder.readDoubleOrUndefined();
    }
  }

  readTIF(): void {
    this.order.tif = this.decoder.readStr() as TimeInForce;
  }

  readOcaGroup(): void {
    this.order.ocaGroup = this.decoder.readStr();
  }

  readAccount(): void {
    this.order.account = this.decoder.readStr();
  }

  readOpenClose(): void {
    this.order.openClose = this.decoder.readStr();
  }

  readOrigin(): void {
    this.order.origin = this.decoder.readInt();
  }

  readOrderRef(): void {
    this.order.orderRef = this.decoder.readStr();
  }

  readClientId(): void {
    if (this.version >= 3) {
      this.order.clientId = this.decoder.readInt();
    }
  }

  readPermId(): void {
    if (this.version >= 4) {
      this.order.permId = this.decoder.readInt();
    }
  }

  readOutsideRth(): void {
    if (this.version >= 4) {
      if (this.version < 18) {
        // will never happen
        /* order.m_ignoreRth = */ this.decoder.readBool();
      } else {
        this.order.outsideRth = this.decoder.readBool();
      }
    }
  }

  readHidden(): void {
    if (this.version >= 4) {
      this.order.hidden = this.decoder.readInt() == 1;
    }
  }

  readDiscretionaryAmount(): void {
    if (this.version >= 4) {
      this.order.discretionaryAmt = this.decoder.readDouble();
    }
  }

  readGoodAfterTime(): void {
    if (this.version >= 5) {
      this.order.goodAfterTime = this.decoder.readStr();
    }
  }

  skipSharesAllocation(): void {
    if (this.version >= 6) {
      // skip deprecated sharesAllocation field
      this.decoder.readStr();
    }
  }

  readFAParams(): void {
    if (this.version >= 7) {
      this.order.faGroup = this.decoder.readStr();
      this.order.faMethod = this.decoder.readStr();
      this.order.faPercentage = this.decoder.readStr();
      if (this.version < MIN_SERVER_VER.FA_PROFILE_DESUPPORT)
        this.order.faProfile = this.decoder.readStr();
    }
  }

  readModelCode(): void {
    if (this.version >= MIN_SERVER_VER.MODELS_SUPPORT) {
      this.order.modelCode = this.decoder.readStr();
    }
  }

  readGoodTillDate(): void {
    if (this.version >= 8) {
      this.order.goodTillDate = this.decoder.readStr();
    }
  }

  readRule80A(): void {
    if (this.version >= 9) {
      this.order.rule80A = this.decoder.readStr();
    }
  }

  readPercentOffset() {
    if (this.version >= 9) {
      this.order.percentOffset = this.decoder.readDoubleOrUndefined();
    }
  }

  readSettlingFirm(): void {
    if (this.version >= 9) {
      this.order.settlingFirm = this.decoder.readStr();
    }
  }

  readShortSaleParams(): void {
    if (this.version >= 9) {
      this.order.shortSaleSlot = this.decoder.readInt();
      this.order.designatedLocation = this.decoder.readStr();
      if (this.version == 51) {
        this.decoder.readInt(); // exemptCode
      } else if (this.version >= 23) {
        this.order.exemptCode = this.decoder.readInt();
      }
    }
  }

  readAuctionStrategy(): void {
    if (this.version >= 9) {
      this.order.auctionStrategy = this.decoder.readInt();
    }
  }

  readBoxOrderParams(): void {
    if (this.version >= 9) {
      this.order.startingPrice = this.decoder.readDoubleOrUndefined();
      this.order.stockRefPrice = this.decoder.readDoubleOrUndefined();
      this.order.delta = this.decoder.readDoubleOrUndefined();
    }
  }

  readPegToStkOrVolOrderParams(): void {
    if (this.version >= 9) {
      this.order.stockRangeLower = this.decoder.readDoubleOrUndefined();
      this.order.stockRangeUpper = this.decoder.readDoubleOrUndefined();
    }
  }

  readDisplaySize(): void {
    if (this.version >= 9) {
      this.order.displaySize = this.decoder.readIntOrUndefined();
    }
  }

  readOldStyleOutsideRth(): void {
    if (this.version >= 9) {
      if (this.version < 18) {
        // will never happen
        /* order.m_rthOnly = */ this.decoder.readBool();
      }
    }
  }

  readBlockOrder(): void {
    if (this.version >= 9) {
      this.order.blockOrder = this.decoder.readBool();
    }
  }

  readSweepToFill(): void {
    if (this.version >= 9) {
      this.order.sweepToFill = this.decoder.readBool();
    }
  }

  readAllOrNone(): void {
    if (this.version >= 9) {
      this.order.allOrNone = this.decoder.readBool();
    }
  }

  readMinQty(): void {
    if (this.version >= 9) {
      this.order.minQty = this.decoder.readIntOrUndefined();
    }
  }

  readOcaType(): void {
    if (this.version >= 9) {
      this.order.ocaType = this.decoder.readInt();
    }
  }

  readETradeOnly(): void {
    if (this.version >= 9) {
      this.order.eTradeOnly = this.decoder.readBool();
    }
  }

  readFirmQuoteOnly(): void {
    if (this.version >= 9) {
      this.order.firmQuoteOnly = this.decoder.readBool();
    }
  }

  readNbboPriceCap(): void {
    if (this.version >= 9) {
      this.order.nbboPriceCap = this.decoder.readDoubleOrUndefined();
    }
  }

  readParentId(): void {
    if (this.version >= 10) {
      this.order.parentId = this.decoder.readInt();
    }
  }

  readTriggerMethod(): void {
    if (this.version >= 10) {
      this.order.triggerMethod = this.decoder.readInt();
    }
  }

  readVolOrderParams(readOpenOrderAttribs: boolean): void {
    if (this.version >= 11) {
      this.order.volatility = this.decoder.readDoubleOrUndefined();
      this.order.volatilityType = this.decoder.readInt();
      if (this.version == 11) {
        const receivedInt = this.decoder.readInt();
        this.order.deltaNeutralOrderType = receivedInt == 0 ? "NONE" : "MKT";
      } else {
        this.order.deltaNeutralOrderType = this.decoder.readStr();
        this.order.deltaNeutralAuxPrice = this.decoder.readDoubleOrUndefined();

        if (
          this.version >= 27 &&
          this.order.deltaNeutralOrderType &&
          this.order.deltaNeutralOrderType !== ""
        ) {
          this.order.deltaNeutralConId = this.decoder.readInt();
          if (readOpenOrderAttribs) {
            this.order.deltaNeutralSettlingFirm = this.decoder.readStr();
            this.order.deltaNeutralClearingAccount = this.decoder.readStr();
            this.order.deltaNeutralClearingIntent = this.decoder.readStr();
          }
        }

        if (
          this.version >= 31 &&
          this.order.deltaNeutralOrderType &&
          this.order.deltaNeutralOrderType !== ""
        ) {
          if (readOpenOrderAttribs) {
            this.order.deltaNeutralOpenClose = this.decoder.readStr();
          }
          this.order.deltaNeutralShortSale = this.decoder.readBool();
          this.order.deltaNeutralShortSaleSlot = this.decoder.readInt();
          this.order.deltaNeutralDesignatedLocation = this.decoder.readStr();
        }
      }
      this.order.continuousUpdate = this.decoder.readInt();
      if (this.version == 26) {
        this.order.stockRangeLower = this.decoder.readDouble();
        this.order.stockRangeUpper = this.decoder.readDouble();
      }
      this.order.referencePriceType = this.decoder.readInt();
    }
  }

  readTrailParams(): void {
    if (this.version >= 13) {
      this.order.trailStopPrice = this.decoder.readDoubleOrUndefined();
    }

    if (this.version >= 30) {
      this.order.trailingPercent = this.decoder.readDoubleOrUndefined();
    }
  }

  readBasisPoints(): void {
    if (this.version >= 14) {
      this.order.basisPoints = this.decoder.readDoubleOrUndefined();
      this.order.basisPointsType = this.decoder.readIntOrUndefined();
    }
  }

  readComboLegs(): void {
    if (this.version >= 14) {
      this.contract.comboLegsDescription = this.decoder.readStr();
    }

    if (this.version >= 29) {
      const comboLegsCount = this.decoder.readInt();
      if (comboLegsCount > 0) {
        this.contract.comboLegs = [];
        for (let i = 0; i < comboLegsCount; ++i) {
          const conId = this.decoder.readInt();
          const ratio = this.decoder.readInt();
          const action = this.decoder.readStr() as OrderAction;
          const exchange = this.decoder.readStr();
          const openClose = this.decoder.readInt();
          const shortSaleSlot = this.decoder.readInt();
          const designatedLocation = this.decoder.readStr();
          const exemptCode = this.decoder.readInt();

          this.contract.comboLegs.push({
            conId,
            ratio,
            action,
            exchange,
            openClose,
            shortSaleSlot,
            designatedLocation,
            exemptCode,
          });
        }
      }

      const orderComboLegsCount = this.decoder.readInt();
      if (orderComboLegsCount > 0) {
        this.order.orderComboLegs = [];
        for (let i = 0; i < orderComboLegsCount; ++i) {
          const price = this.decoder.readDoubleOrUndefined();

          this.order.orderComboLegs.push({
            price,
          });
        }
      }
    }
  }

  readSmartComboRoutingParams(): void {
    if (this.version >= 26) {
      const smartComboRoutingParamsCount = this.decoder.readInt();
      if (smartComboRoutingParamsCount > 0) {
        this.order.smartComboRoutingParams = [];
        for (let i = 0; i < smartComboRoutingParamsCount; ++i) {
          const tag = this.decoder.readStr();
          const value = this.decoder.readStr();
          this.order.smartComboRoutingParams.push({
            tag,
            value,
          });
        }
      }
    }
  }

  readScaleOrderParams(): void {
    if (this.version >= 15) {
      if (this.version >= 20) {
        this.order.scaleInitLevelSize = this.decoder.readIntOrUndefined();
        this.order.scaleSubsLevelSize = this.decoder.readIntOrUndefined();
      } else {
        /* int notSuppScaleNumComponents = */ this.decoder.readIntOrUndefined();
        this.order.scaleInitLevelSize = this.decoder.readIntOrUndefined();
      }
      this.order.scalePriceIncrement = this.decoder.readDoubleOrUndefined();
    }

    if (
      this.version >= 28 &&
      this.order.scalePriceIncrement &&
      this.order.scalePriceIncrement > 0.0
    ) {
      this.order.scalePriceAdjustValue = this.decoder.readDoubleOrUndefined();
      this.order.scalePriceAdjustInterval = this.decoder.readIntOrUndefined();
      this.order.scaleProfitOffset = this.decoder.readDoubleOrUndefined();
      this.order.scaleAutoReset = this.decoder.readBool();
      this.order.scaleInitPosition = this.decoder.readIntOrUndefined();
      this.order.scaleInitFillQty = this.decoder.readIntOrUndefined();
      this.order.scaleRandomPercent = this.decoder.readBool();
    }
  }

  readHedgeParams(): void {
    if (this.version >= 24) {
      this.order.hedgeType = this.decoder.readStr();
      if (this.order.hedgeType && this.order.hedgeType !== "") {
        this.order.hedgeParam = this.decoder.readStr();
      }
    }
  }

  readOptOutSmartRouting(): void {
    if (this.version >= 25) {
      this.order.optOutSmartRouting = this.decoder.readBool();
    }
  }

  readClearingParams(): void {
    if (this.version >= 19) {
      this.order.clearingAccount = this.decoder.readStr();
      this.order.clearingIntent = this.decoder.readStr();
    }
  }

  readNotHeld(): void {
    if (this.version >= 22) {
      this.order.notHeld = this.decoder.readBool();
    }
  }

  readDeltaNeutral(): void {
    if (this.version >= 20) {
      if (this.decoder.readBool()) {
        const conId = this.decoder.readInt();
        const delta = this.decoder.readDouble();
        const price = this.decoder.readDouble();
        this.contract.deltaNeutralContract = {
          conId,
          delta,
          price,
        };
      }
    }
  }

  readAlgoParams(): void {
    if (this.version >= 21) {
      this.order.algoStrategy = this.decoder.readStr();
      if (this.order.algoStrategy && this.order.algoStrategy !== "") {
        const algoParamsCount = this.decoder.readInt();
        if (algoParamsCount > 0) {
          this.order.algoParams = [];
          for (let i = 0; i < algoParamsCount; ++i) {
            const tag = this.decoder.readStr();
            const value = this.decoder.readStr();
            this.order.algoParams.push({
              tag,
              value,
            });
          }
        }
      }
    }
  }

  readSolicited(): void {
    if (this.version >= 33) {
      this.order.solicited = this.decoder.readBool();
    }
  }

  readWhatIfInfoAndCommission(): void {
    if (this.version >= 16) {
      this.order.whatIf = this.decoder.readBool();

      this.readOrderStatus();

      if (this.serverVersion >= MIN_SERVER_VER.WHAT_IF_EXT_FIELDS) {
        this.orderState.initMarginBefore = this.decoder.readDoubleOrUndefined();
        this.orderState.maintMarginBefore =
          this.decoder.readDoubleOrUndefined();
        this.orderState.equityWithLoanBefore =
          this.decoder.readDoubleOrUndefined();
        this.orderState.initMarginChange = this.decoder.readDoubleOrUndefined();
        this.orderState.maintMarginChange =
          this.decoder.readDoubleOrUndefined();
        this.orderState.equityWithLoanChange =
          this.decoder.readDoubleOrUndefined();
      }

      this.orderState.initMarginAfter = this.decoder.readDoubleOrUndefined();
      this.orderState.maintMarginAfter = this.decoder.readDoubleOrUndefined();
      this.orderState.equityWithLoanAfter =
        this.decoder.readDoubleOrUndefined();
      this.orderState.commission = this.decoder.readDoubleOrUndefined();
      this.orderState.minCommission = this.decoder.readDoubleOrUndefined();
      this.orderState.maxCommission = this.decoder.readDoubleOrUndefined();
      this.orderState.commissionCurrency = this.decoder.readStr();
      this.orderState.warningText = this.decoder.readStr();
    }
  }

  readOrderStatus(): void {
    this.orderState.status = this.decoder.readStr() as OrderStatus;
  }

  readVolRandomizeFlags(): void {
    if (this.version >= 34) {
      this.order.randomizeSize = this.decoder.readBool();
      this.order.randomizePrice = this.decoder.readBool();
    }
  }

  readPegToBenchParams(): void {
    if (this.serverVersion >= MIN_SERVER_VER.PEGGED_TO_BENCHMARK) {
      if (isPegBenchOrder(this.order.orderType)) {
        this.order.referenceContractId = this.decoder.readInt();
        this.order.isPeggedChangeAmountDecrease = this.decoder.readBool();
        this.order.peggedChangeAmount = this.decoder.readDouble();
        this.order.referenceChangeAmount = this.decoder.readDouble();
        this.order.referenceExchangeId = this.decoder.readStr();
      }
    }
  }

  readConditions(): void {
    if (this.serverVersion >= MIN_SERVER_VER.PEGGED_TO_BENCHMARK) {
      const nConditions = this.decoder.readInt();

      if (nConditions > 0) {
        this.order.conditions = new Array(nConditions);

        for (let i = 0; i < nConditions; i++) {
          const orderConditionType = this.decoder.readInt();

          // OrderCondition
          const conjunctionConnection = this.decoder
            .readStr()
            ?.toLocaleLowerCase();

          switch (orderConditionType) {
            case OrderConditionType.Execution: {
              const secType = this.decoder.readStr() as SecType;
              const exchange = this.decoder.readStr();
              const symbol = this.decoder.readStr();

              this.order.conditions[i] = new ExecutionCondition(
                exchange,
                secType,
                symbol,
                conjunctionConnection as ConjunctionConnection,
              );
              break;
            }

            case OrderConditionType.Margin: {
              // OperatorCondition
              const isMore = this.decoder.readBool();
              const value = this.decoder.readInt();

              this.order.conditions[i] = new MarginCondition(
                value,
                isMore,
                conjunctionConnection as ConjunctionConnection,
              );
              break;
            }

            case OrderConditionType.PercentChange: {
              // OperatorCondition
              const isMore = this.decoder.readBool();
              const value = this.decoder.readDouble();
              // ContractCondition
              const condId = this.decoder.readInt();
              const exchange = this.decoder.readStr();

              this.order.conditions[i] = new PercentChangeCondition(
                value,
                condId,
                exchange,
                isMore,
                conjunctionConnection as ConjunctionConnection,
              );
              break;
            }

            case OrderConditionType.Price: {
              // OperatorCondition
              const isMore = this.decoder.readBool();
              const value = this.decoder.readDouble();
              // ContractCondition
              const condId = this.decoder.readInt();
              const exchange = this.decoder.readStr();
              // PriceCondition
              const triggerMethod = this.decoder.readInt() as TriggerMethod;

              this.order.conditions[i] = new PriceCondition(
                value,
                triggerMethod,
                condId,
                exchange,
                isMore,
                conjunctionConnection as ConjunctionConnection,
              );
              break;
            }

            case OrderConditionType.Time: {
              // OperatorCondition
              const isMore = this.decoder.readBool();
              const value = this.decoder.readStr();

              this.order.conditions[i] = new TimeCondition(
                value,
                isMore,
                conjunctionConnection as ConjunctionConnection,
              );
              break;
            }

            case OrderConditionType.Volume: {
              // OperatorCondition
              const isMore = this.decoder.readBool();
              const value = this.decoder.readInt();
              // ContractCondition
              const condId = this.decoder.readInt();
              const exchange = this.decoder.readStr();

              this.order.conditions[i] = new VolumeCondition(
                value,
                condId,
                exchange,
                isMore,
                conjunctionConnection as ConjunctionConnection,
              );
              break;
            }
          }
        }

        this.order.conditionsIgnoreRth = this.decoder.readBool();
        this.order.conditionsCancelOrder = this.decoder.readBool();
      }
    }
  }

  readAdjustedOrderParams(): void {
    if (this.serverVersion >= MIN_SERVER_VER.PEGGED_TO_BENCHMARK) {
      this.order.adjustedOrderType = this.decoder.readStr();
      this.order.triggerPrice = this.decoder.readDoubleOrUndefined();
      this.readStopPriceAndLmtPriceOffset();
      this.order.adjustedStopPrice = this.decoder.readDoubleOrUndefined();
      this.order.adjustedStopLimitPrice = this.decoder.readDoubleOrUndefined();
      this.order.adjustedTrailingAmount = this.decoder.readDoubleOrUndefined();
      this.order.adjustableTrailingUnit = this.decoder.readInt();
    }
  }

  readStopPriceAndLmtPriceOffset(): void {
    this.order.trailStopPrice = this.decoder.readDoubleOrUndefined();
    this.order.lmtPriceOffset = this.decoder.readDoubleOrUndefined();
  }

  readSoftDollarTier(): void {
    if (this.serverVersion >= MIN_SERVER_VER.SOFT_DOLLAR_TIER) {
      const name = this.decoder.readStr();
      const value = this.decoder.readStr();
      const displayName = this.decoder.readStr();
      this.order.softDollarTier = {
        name,
        value,
        displayName,
      };
    }
  }

  readCashQty(): void {
    if (this.serverVersion >= MIN_SERVER_VER.CASH_QTY) {
      this.order.cashQty = this.decoder.readDoubleOrUndefined();
    }
  }

  readDontUseAutoPriceForHedge(): void {
    if (this.serverVersion >= MIN_SERVER_VER.AUTO_PRICE_FOR_HEDGE) {
      this.order.dontUseAutoPriceForHedge = this.decoder.readBool();
    }
  }

  readIsOmsContainer(): void {
    if (this.serverVersion >= MIN_SERVER_VER.ORDER_CONTAINER) {
      this.order.isOmsContainer = this.decoder.readBool();
    }
  }

  readDiscretionaryUpToLimitPrice(): void {
    if (this.serverVersion >= MIN_SERVER_VER.D_PEG_ORDERS) {
      this.order.discretionaryUpToLimitPrice = this.decoder.readBool();
    }
  }

  readAutoCancelDate(): void {
    this.order.autoCancelDate = this.decoder.readStr();
  }

  readFilledQuantity(): void {
    this.order.filledQuantity = this.decoder.readDecimal();
  }

  readRefFuturesConId(): void {
    this.order.refFuturesConId = this.decoder.readInt();
  }

  readAutoCancelParent(minVersionAutoCancelParent?: number): void {
    if (
      minVersionAutoCancelParent === undefined ||
      this.serverVersion >= minVersionAutoCancelParent
    ) {
      this.order.autoCancelParent = this.decoder.readBool();
    }
  }

  readShareholder(): void {
    this.order.shareholder = this.decoder.readStr();
  }

  readImbalanceOnly(): void {
    this.order.imbalanceOnly = this.decoder.readBool();
  }

  readRouteMarketableToBbo(): void {
    this.order.routeMarketableToBbo = this.decoder.readBool();
  }

  readParentPermId(): void {
    this.order.parentPermId = this.decoder.readInt();
  }

  readCompletedTime(): void {
    this.orderState.completedTime = this.decoder.readStr();
  }

  readCompletedStatus(): void {
    this.orderState.completedStatus = this.decoder.readStr();
  }

  readUsePriceMgmtAlgo(): void {
    if (this.serverVersion >= MIN_SERVER_VER.PRICE_MGMT_ALGO) {
      this.order.usePriceMgmtAlgo = this.decoder.readBool();
    }
  }

  readDuration(): void {
    if (this.serverVersion >= MIN_SERVER_VER.DURATION) {
      this.order.duration = this.decoder.readInt();
    }
  }

  readPostToAts(): void {
    if (this.serverVersion >= MIN_SERVER_VER.POST_TO_ATS) {
      this.order.postToAts = this.decoder.readIntOrUndefined();
    }
  }

  readPegBestPegMidOrderAttributes() {
    if (this.serverVersion >= MIN_SERVER_VER.PEGBEST_PEGMID_OFFSETS) {
      this.order.minTradeQty = this.decoder.readIntOrUndefined();
      this.order.minCompeteSize = this.decoder.readIntOrUndefined();
      this.order.competeAgainstBestOffset =
        this.decoder.readDoubleOrUndefined();
      this.order.midOffsetAtWhole = this.decoder.readDoubleOrUndefined();
      this.order.midOffsetAtHalf = this.decoder.readDoubleOrUndefined();
    }
  }

  readCustomerAccount() {
    if (this.serverVersion >= MIN_SERVER_VER.CUSTOMER_ACCOUNT) {
      this.order.customerAccount = this.decoder.readStr();
    }
  }

  readProfessionalCustomer() {
    if (this.serverVersion >= MIN_SERVER_VER.PROFESSIONAL_CUSTOMER) {
      this.order.professionalCustomer = this.decoder.readBool();
    }
  }

  readBondAccruedInterest() {
    if (this.serverVersion >= MIN_SERVER_VER.BOND_ACCRUED_INTEREST) {
      this.order.bondAccruedInterest = this.decoder.readStr();
    }
  }

  readIncludeOvernight() {
    if (this.serverVersion >= MIN_SERVER_VER.INCLUDE_OVERNIGHT) {
      this.order.includeOvernight = this.decoder.readBool();
    }
  }

  readCMETaggingFields() {
    if (this.serverVersion >= MIN_SERVER_VER.CME_TAGGING_FIELDS_IN_OPEN_ORDER) {
      this.order.extOperator = this.decoder.readStr();
      this.order.manualOrderIndicator = this.decoder.readIntOrUndefined();
    }
  }
}
