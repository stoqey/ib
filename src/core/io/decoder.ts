import { ComboLeg } from "../../api/contract/comboLeg";
import { Contract } from "../../api/contract/contract";
import { ContractDescription } from "../../api/contract/contractDescription";
import { ContractDetails } from "../../api/contract/contractDetails";
import { DeltaNeutralContract } from "../../api/contract/deltaNeutralContract";
import DepthMktDataDescription from "../../api/data/container/depth-mkt-data-description";
import FamilyCode from "../../api/data/container/family-code";
import NewsProvider from "../../api/data/container/news-provider";
import SoftDollarTier from "../../api/data/container/soft-dollar-tier";
import TagValue from "../../api/data/container/tag-value";
import { EventName } from "../../api/data/enum/event-name";
import MIN_SERVER_VER from "../../api/data/enum/min-server-version";
import OptionType from "../../api/data/enum/option-type";
import SecType from "../../api/data/enum/sec-type";
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
import { OrderType } from "../../api/order/enum/orderType";
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
   */
  emitError(errMsg: string, code: number, reqId: number): void;

  /**
   * Emit an information message event to public API interface.
   *
   * @param errMsg The message text.
   */
  emitInfo(message: string): void;
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
      default:
        this.callback.emitError(
          `No parser implementation found for token: ${IN_MSG_ID[msgId]} (${msgId}).`,
          ErrorCode.UNKNOWN_ID,
          -1
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

      let msgId: IN_MSG_ID = -1;

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
                this.dataQueue
              )}). Please report to https://github.com/stoqey/ib`,
              ErrorCode.UNKNOWN_ID,
              -1
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
            -1
          );
        }

        this.drainQueue();
      }

      // Emit events

      const toEmit = this.emitQueue;
      this.emitQueue = [];
      toEmit.forEach((item) =>
        this.callback.emitEvent(item.name, ...item.args)
      );
    }
  }

  /**
   * Get the API server version.
   */
  private get serverVersion(): number {
    return this.callback.serverVersion;
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
    return !!parseInt(this.readStr(), 10);
  }

  /**
   * Read a token from queue and return it as floating point value.
   *
   * Returns 0 if the token is empty.
   */
  readDouble(): number {
    const token = this.readStr();
    if (token === null || token === "") {
      return 0;
    }
    return parseFloat(token);
  }

  /**
   * Read a token from queue and return it as floating point value.
   *
   * Returns Number.MAX_VALUE if the token is empty.
   */
  readDoubleMax(): number {
    const token = this.readStr();
    if (token === null || token === "") {
      return Number.MAX_VALUE;
    }
    return parseFloat(token);
  }

  /**
   * Read a token from queue and return it as integer value.
   *
   * Returns 0 if the token is empty.
   */
  readInt(): number {
    const token = this.readStr();
    if (token === null || token === "") {
      return 0;
    }
    return parseInt(token, 10);
  }

  /**
   * Read a token from queue and return it as integer value.
   *
   * Returns Number.MAX_VALUE if the token is empty.
   */
  readIntMax(): number {
    const token = this.readStr();
    if (token === null || token === "") {
      return Number.MAX_VALUE;
    }
    return parseInt(token, 10);
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

    let size = 0;
    if (version >= 2) {
      size = this.readInt();
    }

    let canAutoExecute = false;
    if (version >= 3) {
      canAutoExecute = this.readBool();
    }

    // emit events

    this.emit(EventName.tickPrice, tickerId, tickType, price, canAutoExecute);

    let sizeTickType = -1;
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

    if (sizeTickType !== -1) {
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
    const size = this.readInt();

    this.emit(EventName.tickSize, tickerId, tickType, size);
  }

  /**
   * Decode a ORDER_STATUS message from data queue and emit an orderStatus event.
   */
  private decodeMsg_ORDER_STATUS(): void {
    const version =
      this.serverVersion >= MIN_SERVER_VER.MARKET_CAP_PRICE
        ? Number.MAX_VALUE
        : this.readInt();
    const id = this.readInt();
    const status = this.readStr();
    const filled = this.readInt();
    const remaining = this.readInt();
    const avgFillPrice = this.readDouble();

    let permId = 0;
    if (version >= 2) {
      permId = this.readInt();
    }

    let parentId = 0;
    if (version >= 3) {
      parentId = this.readInt();
    }

    let lastFillPrice = 0;
    if (version >= 4) {
      lastFillPrice = this.readDouble();
    }

    let clientId = 0;
    if (version >= 5) {
      clientId = this.readInt();
    }

    let whyHeld: string | undefined = undefined;
    if (version >= 6) {
      whyHeld = this.readStr();
    }

    let mktCapPrice = Number.MAX_VALUE;
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
      mktCapPrice
    );
  }

  /**
   * Decode a ERR_MSG message from data queue and emit and error event.
   */
  private decodeMsg_ERR_MSG(): void {
    const version = this.readInt();
    if (version < 2) {
      const errorMsg = this.readStr();
      this.callback.emitError(errorMsg, -1, -1);
    } else {
      const id = this.readInt();
      const code = this.readInt();
      const msg = this.readStr();
      if (id === -1) {
        this.callback.emitInfo(msg);
      } else {
        this.callback.emitError(msg, code, id);
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
      this.serverVersion
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
   * Decode a PORTFOLIO_VALUE message from data queue and emit a updatePortfolio event.
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
    contract.right = this.readStr() as OptionType;

    if (version >= 7) {
      contract.multiplier = this.readInt();
      contract.primaryExch = this.readStr();
    }

    contract.currency = this.readStr();

    if (version >= 2) {
      contract.localSymbol = this.readStr();
    }

    if (version >= 8) {
      contract.tradingClass = this.readStr();
    }

    let position: number;
    if (this.serverVersion >= MIN_SERVER_VER.FRACTIONAL_POSITIONS) {
      position = this.readDouble();
    } else {
      position = this.readInt();
    }

    const marketPrice = this.readDouble();
    const marketValue = this.readDouble();
    let averageCost = Number.MAX_VALUE;
    let unrealizedPNL = Number.MAX_VALUE;
    let realizedPNL = Number.MAX_VALUE;
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
      accountName
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
    const version = this.readInt();

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
    contract.contract.strike = this.readDouble();
    contract.contract.right = this.readStr() as OptionType;
    contract.contract.exchange = this.readStr();
    contract.contract.currency = this.readStr();
    contract.contract.localSymbol = this.readStr();
    contract.marketName = this.readStr();
    contract.contract.tradingClass = this.readStr();
    contract.contract.conId = this.readInt();
    contract.minTick = this.readDouble();
    if (this.serverVersion >= MIN_SERVER_VER.MD_SIZE_MULTIPLIER) {
      contract.mdSizeMultiplier = this.readInt();
    }
    contract.contract.multiplier = this.readInt();
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
    contract.right = this.readStr() as OptionType;

    if (version >= 9) {
      contract.multiplier = this.readInt();
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
    exec.shares = this.readInt();
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
      exec.cumQty = this.readInt();
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
      exec.lastLiquidity = { value: this.readInt() };
    }

    this.emit(EventName.execDetails, reqId, contract, exec);
  }

  /**
   * Decode a MARKET_DEPTH message from data queue and emit a updateMktDepth event.
   */
  private decodeMsg_MARKET_DEPTH(): void {
    this.readInt(); // version
    const id = this.readInt();
    const position = this.readInt();
    const operation = this.readInt();
    const side = this.readInt();
    const price = this.readDouble();
    const size = this.readInt();

    this.emit(
      EventName.updateMktDepth,
      id,
      position,
      operation,
      side,
      price,
      size
    );
  }

  /**
   * Decode a MARKET_DEPTH_L2 message from data queue and emit a updateMktDepthL2 event.
   */
  private decodeMsg_MARKET_DEPTH_L2(): void {
    this.readInt(); // version
    const id = this.readInt();
    const position = this.readInt();
    const marketMaker = this.readStr();
    const operation = this.readInt();
    const side = this.readInt();
    const price = this.readDouble();
    const size = this.readInt();

    let isSmartDepth = false;
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
      isSmartDepth
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
      originatingExch
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
    let version = Number.MAX_VALUE;
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
      const volume = this.readInt();
      const WAP = this.readDouble();
      let hasGaps: boolean | undefined = undefined;
      if (this.serverVersion < MIN_SERVER_VER.SYNT_REALTIME_BARS) {
        hasGaps = this.readBool();
      }

      let barCount = -1;
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
        hasGaps
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
      false
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
    const WAP = this.readDouble();
    const volume = this.readInt();
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
      WAP
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
    const priceIncrements = new Array(nPriceIncrements);

    for (let i = 0; i < nPriceIncrements; i++) {
      priceIncrements[i] = {
        lowEdge: this.readDouble(),
        increment: this.readDouble(),
      };
    }

    this.emit(EventName.marketRule, marketRuleId, priceIncrements);
  }

  /**
   * Decode a BOND_CONTRACT_DATA message from data queue and emit a bondContractDetails event.
   */
  private decodeMsg_BOND_CONTRACT_DATA(): void {
    const version = this.readInt();

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
    if (this.serverVersion >= MIN_SERVER_VER.MD_SIZE_MULTIPLIER) {
      contract.mdSizeMultiplier = this.readInt();
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

    this.emit(EventName.bondContractDetails, reqId, contract);
  }

  /**
   * Decode a SCANNER_PARAMETERS message from data queue and emit a scannerParameters event.
   */
  private decodeMsg_SCANNER_PARAMETERS(): void {
    this.readInt(); // version
    const xml = this.readStr();

    this.emit(EventName.scannerParameters, xml);
  }

  /**
   * Decode a SCANNER_DATA message from data queue and emit a scannerData and scannerDataEnd event.
   */
  private decodeMsg_SCANNER_DATA(): void {
    const version = this.readInt();
    const tickerId = this.readInt();
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
      contract.contract.right = this.readStr() as OptionType;
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
        tickerId,
        rank,
        contract,
        distance,
        benchmark,
        projection,
        legsStr
      );
    }

    this.emit(EventName.scannerDataEnd, tickerId);
  }

  /**
   * Decode a TICK_OPTION_COMPUTATION message from data queue and emit a tickOptionComputation event.
   */
  private decodeMsg_TICK_OPTION_COMPUTATION(): void {
    const version = this.readInt();
    const tickerId = this.readInt();
    const tickType = this.readInt();

    let impliedVol = this.readDouble();
    if (impliedVol == -1) {
      // -1 is the "not yet computed" indicator
      impliedVol = Number.MAX_VALUE;
    }

    let delta = this.readDouble();
    if (delta == -2) {
      // -2 is the "not yet computed" indicator
      delta = Number.MAX_VALUE;
    }

    let optPrice = Number.MAX_VALUE;
    let pvDividend = Number.MAX_VALUE;
    let gamma = Number.MAX_VALUE;
    let vega = Number.MAX_VALUE;
    let theta = Number.MAX_VALUE;
    let undPrice = Number.MAX_VALUE;

    if (
      version >= 6 ||
      tickType === TickType.MODEL_OPTION ||
      tickType === TickType.DELAYED_MODEL_OPTION
    ) {
      optPrice = this.readDouble();
      if (optPrice == -1) {
        // -1 is the "not yet computed" indicator
        optPrice = Number.MAX_VALUE;
      }

      pvDividend = this.readDouble();
      if (pvDividend == -1) {
        // -1 is the "not yet computed" indicator
        pvDividend = Number.MAX_VALUE;
      }
    }

    if (version >= 6) {
      gamma = this.readDouble();
      if (gamma == -2) {
        // -2 is the "not yet computed" indicator
        gamma = Number.MAX_VALUE;
      }

      vega = this.readDouble();
      if (vega == -2) {
        // -2 is the "not yet computed" indicator
        vega = Number.MAX_VALUE;
      }

      theta = this.readDouble();
      if (theta == -2) {
        // -2 is the "not yet computed" indicator
        theta = Number.MAX_VALUE;
      }

      undPrice = this.readDouble();
      if (undPrice == -1) {
        // -1 is the "not yet computed" indicator
        undPrice = Number.MAX_VALUE;
      }
    }

    this.emit(
      EventName.tickOptionComputation,
      tickerId,
      tickType,
      impliedVol,
      delta,
      optPrice,
      pvDividend,
      gamma,
      vega,
      theta,
      undPrice
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
      dividendsToExpiry
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
   * Decode a REAL_TIME_BARS message from data queue and emit a realtimeBar event.
   */
  private decodeMsg_REAL_TIME_BARS(): void {
    this.readInt(); // version
    const reqId = this.readInt();
    const time = this.readInt();
    const open = this.readDouble();
    const high = this.readDouble();
    const low = this.readDouble();
    const close = this.readDouble();
    const volume = this.readInt();
    const wap = this.readDouble();
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
      count
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
    contract.right = this.readStr() as OptionType;
    contract.multiplier = this.readInt();
    contract.exchange = this.readStr();
    contract.currency = this.readStr();
    contract.localSymbol = this.readStr();
    if (version >= 2) {
      contract.tradingClass = this.readStr();
    }

    const pos =
      this.serverVersion >= MIN_SERVER_VER.FRACTIONAL_POSITIONS
        ? this.readDouble()
        : this.readInt();

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
   * Decode a POSITION_MULTI message from data queue and emit a accountSummary event.
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
    contract.right = this.readStr() as OptionType;
    contract.multiplier = this.readInt();
    contract.exchange = this.readStr();
    contract.currency = this.readStr();
    contract.localSymbol = this.readStr();
    contract.tradingClass = this.readStr();
    const pos = this.readInt();
    const avgCost = this.readDouble();
    const modelCode = this.readStr();

    this.emit(
      EventName.positionMulti,
      reqId,
      account,
      modelCode,
      contract,
      pos,
      avgCost
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
      currency
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
    const multiplier = this.readStr();
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
      strikes
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
      nContractDescriptions
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
      nDepthMktDataDescriptions
    );
    for (let i = 0; i < nDepthMktDataDescriptions; i++) {
      if (this.serverVersion >= MIN_SERVER_VER.SERVICE_DATA_TYPE) {
        depthMktDataDescriptions[i] = {
          exchange: this.readStr(),
          secType: this.readStr() as SecType,
          listingExch: this.readStr(),
          serviceDataType: this.readStr(),
          aggGroup: this.readInt() || Number.MAX_VALUE,
        };
      } else {
        depthMktDataDescriptions[i] = {
          exchange: this.readStr(),
          secType: this.readStr() as SecType,
          listingExch: "",
          serviceDataType: this.readBool() ? "Deep2" : "Deep",
          aggGroup: Number.MAX_VALUE,
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
      snapshotPermissions
    );
  }

  /**
   * Decode a SMART_COMPONENTS message from data queue and emit a smartComponents event.
   */
  private decodeMsg_SMART_COMPONENTS(): void {
    const reqId = this.readInt();
    const nCount = this.readInt();

    const theMap: Map<number, [string, string]> = new Map();
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
      extraData
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
    const nNewsProviders = this.readInt();
    const newProviders: NewsProvider[] = new Array(nNewsProviders);
    for (let i = 0; i < nNewsProviders; i++) {
      newProviders[i] = {
        providerCode: this.readStr(),
        providerName: this.readStr(),
      };
    }

    this.emit(EventName.historicalNews, newProviders);
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
        size: this.readInt(),
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

    let unrealizedPnL = Number.MAX_VALUE;
    let realizedPnL = Number.MAX_VALUE;

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
    const pos = this.readInt();
    const dailyPnL = this.readDouble();

    let unrealizedPnL = Number.MAX_VALUE;
    let realizedPnL = Number.MAX_VALUE;

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
      value
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
      this.readInt();//for consistency
      const price = this.readDouble();
      const size = this.readInt();
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
      const sizeBid = this.readInt();
      const sizeAsk = this.readInt();
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
      const size = this.readInt();
      const exchange = this.readStr();
      const specialConditions = this.readStr();
      ticks[i] = {
        time: time,
        tickAttribBidAsk: {
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
        const size = this.readInt();
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
          specialConditions
        );
        break;
      }
      case 3: {
        // BidAsk
        const bidPrice = this.readDouble();
        const askPrice = this.readDouble();
        const bidSize = this.readInt();
        const askSize = this.readInt();
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
          { bidPastLow, askPastHigh }
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
    const orderId = this.readInt();
    const apiClientId = this.readDouble();
    const apiOrderId = this.readInt();

    this.emit(EventName.orderBound, orderId, apiClientId, apiOrderId);
  }

  /**
   * Decode a COMPLETED_ORDER message from data queue and a emit completedOrder event.
   */
  private decodeMsg_COMPLETED_ORDER(): void {
    const contract: Contract = {};
    const order: Order = {};
    const orderState: OrderState = {};

    if (this.serverVersion >= 12) {
      contract.conId = this.readInt();
    }
    contract.symbol = this.readStr();
    contract.secType = this.readStr() as SecType;
    contract.lastTradeDateOrContractMonth = this.readStr();
    contract.strike = this.readDouble();
    contract.right = this.readStr() as OptionType;
    if (this.serverVersion >= 32) {
      contract.multiplier = this.readDouble();
    }
    contract.exchange = this.readStr();
    contract.currency = this.readStr();
    if (this.serverVersion >= 2) {
      contract.localSymbol = this.readStr();
    }
    if (this.serverVersion >= 32) {
      contract.tradingClass = this.readStr();
    }
    order.action = this.readStr() as OrderAction;
    if (this.serverVersion >= MIN_SERVER_VER.FRACTIONAL_POSITIONS) {
      order.totalQuantity = this.readDouble();
    } else {
      order.totalQuantity = this.readInt();
    }
    order.orderType = this.readStr() as OrderType;
    if (this.serverVersion < 29) {
      order.lmtPrice = this.readDouble();
    } else {
      order.lmtPrice = this.readDoubleMax();
    }
    if (this.serverVersion < 30) {
      order.auxPrice = this.readDouble();
    } else {
      order.auxPrice = this.readDoubleMax();
    }
    order.tif = this.readStr();
    order.ocaGroup = this.readStr();
    order.account = this.readStr();
    order.openClose = this.readStr();
    order.origin = this.readInt();
    order.orderRef = this.readStr();
    if (this.serverVersion >= 3) {
      order.permId = this.readInt();
    }
    if (this.serverVersion >= 4) {
      order.hidden = this.readBool();
    }
    order.discretionaryAmt =
      this.serverVersion >= 4 ? this.readDouble() : undefined;
    order.goodAfterTime = this.serverVersion >= 4 ? this.readStr() : undefined;

    if (this.serverVersion >= 4) {
      if (this.serverVersion < 18) {
        // will never happen
        /* ignoreRth = */ this.readBool();
      } else {
        order.outsideRth = this.readBool();
      }
    }

    if (this.serverVersion >= 7) {
      order.faGroup = this.readStr();
      order.faMethod = this.readStr();
      order.faPercentage = this.readStr();
      order.faProfile = this.readStr();
    }

    if (this.serverVersion >= MIN_SERVER_VER.MODELS_SUPPORT) {
      order.modelCode = this.readStr();
    }

    if (this.serverVersion >= 8) {
      order.goodTillDate = this.readStr();
    }

    if (this.serverVersion >= 9) {
      order.rule80A = this.readStr();
      order.percentOffset = this.readDoubleMax();
      order.settlingFirm = this.readStr();

      order.shortSaleSlot = this.readInt();
      order.designatedLocation = this.readStr();
      if (this.serverVersion == 51) {
        this.readInt(); // exemptCode
      } else if (this.serverVersion >= 23) {
        order.exemptCode = this.readInt();
      }

      order.startingPrice = this.readDoubleMax();
      order.stockRefPrice = this.readDoubleMax();
      order.delta = this.readDoubleMax();

      order.stockRangeLower = this.readDoubleMax();
      order.stockRangeUpper = this.readDoubleMax();

      order.displaySize = this.readInt();

      order.sweepToFill = this.readBool();
      order.allOrNone = this.readBool();
      order.minQty = this.readIntMax();
      order.ocaType = this.readInt();
    }

    order.triggerMethod = this.serverVersion >= 10 ? this.readInt() : undefined;

    if (this.serverVersion >= 11) {
      order.volatility = this.readDoubleMax();
      order.volatilityType = this.readInt();
      if (this.serverVersion == 11) {
        order.deltaNeutralOrderType = this.readInt() == 0 ? "NONE" : "MKT";
      } else {
        order.deltaNeutralOrderType = this.readStr();
        order.deltaNeutralAuxPrice = this.readDoubleMax();

        if (this.serverVersion >= 27 && order.deltaNeutralOrderType !== "") {
          order.deltaNeutralConId = this.readInt();
        }

        if (this.serverVersion >= 31 && order.deltaNeutralOrderType !== "") {
          order.deltaNeutralShortSale = this.readBool();
          order.deltaNeutralShortSaleSlot = this.readInt();
          order.deltaNeutralDesignatedLocation = this.readStr();
        }
      }
      order.continuousUpdate = this.readInt();
      if (this.serverVersion == 26) {
        order.stockRangeLower = this.readDouble();
        order.stockRangeUpper = this.readDouble();
      }
      order.referencePriceType = this.readInt();
    }

    if (this.serverVersion >= 13) {
      order.trailStopPrice = this.readDoubleMax();
    }

    if (this.serverVersion >= 30) {
      order.trailStopPrice = this.readDoubleMax();
    }

    if (this.serverVersion >= 1) {
      contract.comboLegsDescription = this.readStr();
    }

    if (this.serverVersion >= 29) {
      const comboLegsCount = this.readInt();

      const comboLegs = new Array(comboLegsCount);
      for (let i = 0; i < comboLegsCount; i++) {
        comboLegs[i] = {
          conId: this.readInt(),
          ratio: this.readInt(),
          action: this.readStr(),
          exchange: this.readStr(),
          openClose: this.readInt(),
          shortSaleSlot: this.readInt(),
          designatedLocation: this.readStr(),
          exemptCode: this.readInt(),
        };
      }
      contract.comboLegs = comboLegs;

      const orderComboLegsCount = this.readInt();
      const orderComboLegs = new Array(orderComboLegsCount);
      for (let i = 0; i < orderComboLegsCount; i++) {
        orderComboLegs[i] = { price: this.readDoubleMax() };
      }
      order.orderComboLegs = orderComboLegs;
    }

    if (this.serverVersion >= 26) {
      const smartComboRoutingParamsCount = this.readInt();

      const smartComboRoutingParams = new Array(smartComboRoutingParamsCount);
      for (let i = 0; i < smartComboRoutingParamsCount; i++) {
        smartComboRoutingParams[i] = {
          tag: this.readStr(),
          value: this.readStr(),
        };
      }
      order.smartComboRoutingParams = smartComboRoutingParams;
    }

    if (this.serverVersion >= 15) {
      if (this.serverVersion >= 20) {
        order.scaleInitLevelSize = this.readIntMax();
        order.scaleSubsLevelSize = this.readIntMax();
      } else {
        /* notSuppScaleNumComponents = */ this.readIntMax();
        order.scaleSubsLevelSize = this.readIntMax();
      }
      order.scalePriceIncrement = this.readDoubleMax();
    }

    if (
      this.serverVersion >= 28 &&
      order.scalePriceIncrement != undefined &&
      order.scalePriceIncrement !== Number.MAX_VALUE
    ) {
      order.scalePriceAdjustValue = this.readDoubleMax();
      order.scalePriceAdjustInterval = this.readIntMax();
      order.scaleProfitOffset = this.readDoubleMax();
      order.scaleAutoReset = this.readBool();
      order.scaleInitPosition = this.readIntMax();
      order.scaleInitFillQty = this.readIntMax();
      order.scaleRandomPercent = this.readBool();
    }

    if (this.serverVersion >= 24) {
      order.hedgeType = this.readStr();
      if (order.hedgeType !== "") {
        order.hedgeParam = this.readStr();
      }
    }

    if (this.serverVersion >= 19) {
      order.clearingAccount = this.readStr();
      order.clearingIntent = this.readStr();
    }

    if (this.serverVersion >= 22) {
      order.notHeld = this.readBool();
    }

    if (this.serverVersion >= 20) {
      if (this.readBool()) {
        contract.deltaNeutralContract = {
          conId: this.readInt(),
          delta: this.readDouble(),
          price: this.readDouble(),
        };
      }
    }

    if (this.serverVersion >= 21) {
      order.algoStrategy = this.readStr();
      if (order.algoStrategy !== "") {
        const algoParamsCount = this.readInt();
        const allParams = new Array(algoParamsCount);
        for (let i = 0; i < algoParamsCount; i++) {
          allParams[i] = { tag: this.readStr(), value: this.readStr() };
        }
        order.algoParams = allParams;
      }
    }

    if (this.serverVersion >= 33) {
      order.solicited = this.readBool();
    }

    orderState.status = this.readStr() as OrderStatus;

    if (this.serverVersion >= 34) {
      order.randomizeSize = this.readBool();
      order.randomizePrice = this.readBool();
    }

    if (this.serverVersion >= MIN_SERVER_VER.PEGGED_TO_BENCHMARK) {
      if (order.orderType == OrderType.PEG_BENCH) {
        order.referenceContractId = this.readInt();
        order.isPeggedChangeAmountDecrease = this.readBool();
        order.peggedChangeAmount = this.readDouble();
        order.referenceChangeAmount = this.readDouble();
        order.referenceExchangeId = this.readStr();
      }

      const nConditions = this.readInt();
      order.conditions = new Array(nConditions);
      for (let i = 0; i < nConditions; i++) {
        const type = this.readInt();

        // OrderCondition
        const conjunctionConnection = this.readStr()?.toLocaleLowerCase();

        switch (type) {
          case OrderConditionType.Execution: {
            const secType = this.readStr() as SecType;
            const exchange = this.readStr();
            const symbol = this.readStr();

            order.conditions[i] = new ExecutionCondition(
              exchange,
              secType,
              symbol,
              conjunctionConnection as ConjunctionConnection
            );
            break;
          }

          case OrderConditionType.Margin: {
            // OperatorCondition
            const isMore = this.readBool();
            const value = this.readInt();

            order.conditions[i] = new MarginCondition(
              value,
              isMore,
              conjunctionConnection as ConjunctionConnection
            );
            break;
          }

          case OrderConditionType.PercentChange: {
            // OperatorCondition
            const isMore = this.readBool();
            const value = this.readDouble();
            // ContractCondition
            const condId = this.readInt();
            const exchange = this.readStr();

            order.conditions[i] = new PercentChangeCondition(
              value,
              condId,
              exchange,
              isMore,
              conjunctionConnection as ConjunctionConnection
            );
            break;
          }

          case OrderConditionType.Price: {
            // OperatorCondition
            const isMore = this.readBool();
            const value = this.readDouble();
            // ContractCondition
            const condId = this.readInt();
            const exchange = this.readStr();
            // PriceCondition
            const triggerMethod = this.readInt() as TriggerMethod;

            order.conditions[i] = new PriceCondition(
              value,
              triggerMethod,
              condId,
              exchange,
              isMore,
              conjunctionConnection as ConjunctionConnection
            );
            break;
          }

          case OrderConditionType.Time: {
            // OperatorCondition
            const isMore = this.readBool();
            const value = this.readStr();

            order.conditions[i] = new TimeCondition(
              value,
              isMore,
              conjunctionConnection as ConjunctionConnection
            );
            break;
          }

          case OrderConditionType.Volume: {
            // OperatorCondition
            const isMore = this.readBool();
            const value = this.readInt();
            // ContractCondition
            const condId = this.readInt();
            const exchange = this.readStr();

            order.conditions[i] = new VolumeCondition(
              value,
              condId,
              exchange,
              isMore,
              conjunctionConnection as ConjunctionConnection
            );
            break;
          }
        }
      }

      if (order.conditions.length) {
        order.conditionsIgnoreRth = this.readBool();
        order.conditionsCancelOrder = this.readBool();
      }
    }

    order.trailStopPrice = this.readDoubleMax();
    order.lmtPriceOffset = this.readDoubleMax();

    if (this.serverVersion >= MIN_SERVER_VER.CASH_QTY) {
      order.cashQty = this.readDoubleMax();
    }

    if (this.serverVersion >= MIN_SERVER_VER.AUTO_PRICE_FOR_HEDGE) {
      order.dontUseAutoPriceForHedge = this.readBool();
    }

    if (this.serverVersion >= MIN_SERVER_VER.ORDER_CONTAINER) {
      order.isOmsContainer = this.readBool();
    }

    order.autoCancelDate = this.readStr();
    order.filledQuantity = this.readDoubleMax();
    order.refFuturesConId = this.readInt();
    order.autoCancelParent = this.readBool();
    order.shareholder = this.readStr();
    order.imbalanceOnly = this.readBool();
    order.routeMarketableToBbo = this.readBool();
    order.parentPermId = this.readInt();
    orderState.completedTime = this.readStr();
    orderState.completedStatus = this.readStr();

    this.emit(EventName.completedOrder, contract, order, orderState);
  }

  /**
   * Decode a COMPLETED_ORDER_END message from data queue and a emit completedOrdersEnd event.
   */
  private decodeMsg_COMPLETED_ORDERS_END(): void {
    this.emit(EventName.completedOrdersEnd);
  }

  /**
   * Decode a [[Contract]] object from data queue.
   */
  private decodeContract(version: number): Contract {
    const contract: Contract = {};

    contract.conId = this.readInt();
    contract.symbol = this.readStr();
    contract.secType = this.readStr() as SecType;
    contract.lastTradeDateOrContractMonth = this.readStr();
    contract.strike = this.readDouble();
    contract.right = this.readStr() as OptionType;

    if (version >= 32) {
      contract.multiplier = this.readInt();
    }

    contract.exchange = this.readStr();
    contract.currency = this.readStr();
    contract.localSymbol = this.readStr();

    if (version >= 32) {
      contract.tradingClass = this.readStr();
    }

    return contract;
  }

  /**
   * Decode a [[Order]] object from data queue.
   */
  private decodeOrder(version: number): Order {
    const order: Order = {};

    order.action = this.readStr() as OrderAction;

    if (this.serverVersion >= MIN_SERVER_VER.FRACTIONAL_POSITIONS) {
      order.totalQuantity = this.readDouble();
    } else {
      order.totalQuantity = this.readInt();
    }

    order.orderType = this.readStr() as OrderType;

    if (version < 29) {
      order.lmtPrice = this.readDouble();
    } else {
      order.lmtPrice = this.readDouble() || Number.MAX_VALUE;
    }

    if (version < 30) {
      order.auxPrice = this.readDouble();
    } else {
      order.auxPrice = this.readDouble() || Number.MAX_VALUE;
    }

    order.tif = this.readStr();
    order.ocaGroup = this.readStr();
    order.account = this.readStr();
    order.openClose = this.readStr();
    order.origin = this.readInt();
    order.orderRef = this.readStr();
    order.clientId = this.readInt();
    order.permId = this.readInt();
    order.outsideRth = this.readBool();
    order.hidden = this.readBool();
    order.discretionaryAmt = this.readDouble();
    order.goodAfterTime = this.readStr();
    this.readStr(); // skip deprecated sharesAllocation field
    order.faGroup = this.readStr();
    order.faMethod = this.readStr();
    order.faPercentage = this.readStr();
    order.faProfile = this.readStr();
    if (this.serverVersion >= MIN_SERVER_VER.MODELS_SUPPORT) {
      order.modelCode = this.readStr();
    }
    order.goodTillDate = this.readStr();
    order.rule80A = this.readStr();
    order.percentOffset = this.readDouble() || Number.MAX_VALUE;
    order.settlingFirm = this.readStr();
    order.shortSaleSlot = this.readInt();
    order.designatedLocation = this.readStr();

    if (this.serverVersion === MIN_SERVER_VER.SSHORTX_OLD) {
      this.readInt(); // exemptCode
    } else if (version >= 23) {
      order.exemptCode = this.readInt();
    }

    order.auctionStrategy = this.readInt();
    order.startingPrice = this.readDouble() || Number.MAX_VALUE;
    order.stockRefPrice = this.readDouble() || Number.MAX_VALUE;
    order.delta = this.readDouble() || Number.MAX_VALUE;
    order.stockRangeLower = this.readDouble() || Number.MAX_VALUE;
    order.stockRangeUpper = this.readDouble() || Number.MAX_VALUE;
    order.displaySize = this.readInt();
    order.blockOrder = this.readBool();
    order.sweepToFill = this.readBool();
    order.allOrNone = this.readBool();
    order.minQty = this.readInt() || Number.MAX_VALUE;
    order.ocaType = this.readInt();
    order.eTradeOnly = this.readBool();
    order.firmQuoteOnly = this.readBool();
    order.nbboPriceCap = this.readDouble() || Number.MAX_VALUE;
    order.parentId = this.readInt();
    order.triggerMethod = this.readInt();
    order.volatility = this.readDouble() || Number.MAX_VALUE;
    order.volatilityType = this.readInt();
    order.deltaNeutralOrderType = this.readStr();
    order.deltaNeutralAuxPrice = this.readDouble() || Number.MAX_VALUE;

    if (version >= 27 && order?.deltaNeutralOrderType.length) {
      order.deltaNeutralConId = this.readInt();
      order.deltaNeutralSettlingFirm = this.readStr();
      order.deltaNeutralClearingAccount = this.readStr();
      order.deltaNeutralClearingIntent = this.readStr();
    }

    if (version >= 31 && order?.deltaNeutralOrderType.length) {
      order.deltaNeutralOpenClose = this.readStr();
      order.deltaNeutralShortSale = this.readBool();
      order.deltaNeutralShortSaleSlot = this.readInt();
      order.deltaNeutralDesignatedLocation = this.readStr();
    }

    order.continuousUpdate = this.readInt();
    order.referencePriceType = this.readInt();
    order.trailStopPrice = this.readDouble() || Number.MAX_VALUE;

    if (version >= 30) {
      order.trailingPercent = this.readDouble() || Number.MAX_VALUE;
    }

    order.basisPoints = this.readDouble() || Number.MAX_VALUE;
    order.basisPointsType = this.readInt() || Number.MAX_VALUE;

    return order;
  }

  /**
   * Decode a [[ComboLeg]] object from data queue.
   */
  private decodeComboLeg(): ComboLeg {
    return {
      conId: this.readInt(),
      ratio: this.readInt(),
      action: this.readStr(),
      exchange: this.readStr(),
      openClose: this.readInt(),
      shortSaleSlot: this.readInt(),
      designatedLocation: this.readStr(),
      exemptCode: this.readInt(),
    };
  }

  /**
   * Read last trade date, parse it and assign to proper [[ContractDetails]] attributes.
   */
  private readLastTradeDate(contract: ContractDetails, isBond: boolean): void {
    const lastTradeDateOrContractMonth = this.readStr();
    if (lastTradeDateOrContractMonth?.length) {
      const tokens = lastTradeDateOrContractMonth.split("\\s+");

      if (tokens.length > 0) {
        if (isBond) {
          contract.maturity = tokens[0];
        } else {
          contract.contract.lastTradeDateOrContractMonth = tokens[0];
        }
      }

      if (tokens.length > 1) {
        contract.lastTradeTime = tokens[1];
      }

      if (isBond && tokens.length > 2) {
        contract.timeZoneId = tokens[2];
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
    private serverVersion: number
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
    this.contract.right = this.decoder.readStr() as OptionType;
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
    if (this.serverVersion >= MIN_SERVER_VER.FRACTIONAL_POSITIONS) {
      this.order.totalQuantity = this.decoder.readDouble();
    } else {
      this.order.totalQuantity = this.decoder.readInt();
    }
  }

  readOrderType(): void {
    this.order.orderType = this.decoder.readStr() as OrderType;
  }

  readLmtPrice(): void {
    if (this.version < 29) {
      this.order.lmtPrice = this.decoder.readDouble();
    } else {
      this.order.lmtPrice = this.decoder.readDoubleMax();
    }
  }

  readAuxPrice(): void {
    if (this.version < 30) {
      this.order.auxPrice = this.decoder.readDouble();
    } else {
      this.order.auxPrice = this.decoder.readDoubleMax();
    }
  }

  readTIF(): void {
    this.order.tif = this.decoder.readStr();
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
      this.order.percentOffset = this.decoder.readDoubleMax();
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
      this.order.startingPrice = this.decoder.readDoubleMax();
      this.order.stockRefPrice = this.decoder.readDoubleMax();
      this.order.delta = this.decoder.readDoubleMax();
    }
  }

  readPegToStkOrVolOrderParams(): void {
    if (this.version >= 9) {
      this.order.stockRangeLower = this.decoder.readDoubleMax();
      this.order.stockRangeUpper = this.decoder.readDoubleMax();
    }
  }

  readDisplaySize(): void {
    if (this.version >= 9) {
      this.order.displaySize = this.decoder.readInt();
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
      this.order.minQty = this.decoder.readIntMax();
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
      this.order.nbboPriceCap = this.decoder.readDoubleMax();
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
      this.order.volatility = this.decoder.readDoubleMax();
      this.order.volatilityType = this.decoder.readInt();
      if (this.version == 11) {
        const receivedInt = this.decoder.readInt();
        this.order.deltaNeutralOrderType = receivedInt == 0 ? "NONE" : "MKT";
      } else {
        this.order.deltaNeutralOrderType = this.decoder.readStr();
        this.order.deltaNeutralAuxPrice = this.decoder.readDoubleMax();

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
      this.order.trailStopPrice = this.decoder.readDoubleMax();
    }

    if (this.version >= 30) {
      this.order.trailingPercent = this.decoder.readDoubleMax();
    }
  }

  readBasisPoints(): void {
    if (this.version >= 14) {
      this.order.basisPoints = this.decoder.readDoubleMax();
      this.order.basisPointsType = this.decoder.readIntMax();
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
          const action = this.decoder.readStr();
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

        const orderComboLegsCount = this.decoder.readInt();
        if (orderComboLegsCount > 0) {
          this.order.orderComboLegs = [];
          for (let i = 0; i < orderComboLegsCount; ++i) {
            const price = this.decoder.readDoubleMax();

            this.order.orderComboLegs.push({
              price,
            });
          }
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
        this.order.scaleInitLevelSize = this.decoder.readIntMax();
        this.order.scaleSubsLevelSize = this.decoder.readIntMax();
      } else {
        /* int notSuppScaleNumComponents = */ this.decoder.readIntMax();
        this.order.scaleInitLevelSize = this.decoder.readIntMax();
      }
      this.order.scalePriceIncrement = this.decoder.readDoubleMax();
    }

    if (
      this.version >= 28 &&
      this.order.scalePriceIncrement > 0.0 &&
      this.order.scalePriceIncrement != Number.MAX_VALUE
    ) {
      this.order.scalePriceAdjustValue = this.decoder.readDoubleMax();
      this.order.scalePriceAdjustInterval = this.decoder.readIntMax();
      this.order.scaleProfitOffset = this.decoder.readDoubleMax();
      this.order.scaleAutoReset = this.decoder.readBool();
      this.order.scaleInitPosition = this.decoder.readIntMax();
      this.order.scaleInitFillQty = this.decoder.readIntMax();
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
        this.orderState.initMarginBefore = this.decoder.readStr();
        this.orderState.maintMarginBefore = this.decoder.readStr();
        this.orderState.equityWithLoanBefore = this.decoder.readStr();
        this.orderState.initMarginChange = this.decoder.readStr();
        this.orderState.maintMarginChange = this.decoder.readStr();
        this.orderState.equityWithLoanChange = this.decoder.readStr();
      }

      this.orderState.initMarginAfter = this.decoder.readStr();
      this.orderState.maintMarginAfter = this.decoder.readStr();
      this.orderState.equityWithLoanAfter = this.decoder.readStr();
      this.orderState.commission = this.decoder.readDoubleMax();
      this.orderState.minCommission = this.decoder.readDoubleMax();
      this.orderState.maxCommission = this.decoder.readDoubleMax();
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
      if (this.order.orderType === OrderType.PEG_BENCH) {
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
      this.order.conditions = new Array(nConditions);

      if (nConditions > 0) {
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
                conjunctionConnection as ConjunctionConnection
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
                conjunctionConnection as ConjunctionConnection
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
                conjunctionConnection as ConjunctionConnection
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
                conjunctionConnection as ConjunctionConnection
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
                conjunctionConnection as ConjunctionConnection
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
                conjunctionConnection as ConjunctionConnection
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
      this.order.triggerPrice = this.decoder.readDoubleMax();
      this.readStopPriceAndLmtPriceOffset();
      this.order.adjustedStopPrice = this.decoder.readDoubleMax();
      this.order.adjustedStopLimitPrice = this.decoder.readDoubleMax();
      this.order.adjustedTrailingAmount = this.decoder.readDoubleMax();
      this.order.adjustableTrailingUnit = this.decoder.readInt();
    }
  }

  readStopPriceAndLmtPriceOffset(): void {
    this.order.trailStopPrice = this.decoder.readDoubleMax();
    this.order.lmtPriceOffset = this.decoder.readDoubleMax();
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
      this.order.cashQty = this.decoder.readDoubleMax();
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
    this.order.filledQuantity = this.decoder.readDoubleMax();
  }

  readRefFuturesConId(): void {
    this.order.refFuturesConId = this.decoder.readInt();
  }

  readAutoCancelParent(): void {
    this.order.autoCancelParent = this.decoder.readBool();
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
}
