import * as C from "../constants";
import { Contract, OptionType, SecType,} from "../api/contract/contract";
import { ContractDescription } from "../api/contract/contractDescription";
import { Controller } from "./controller";
import { HistoricalTick } from "../api/historical/historicalTick";
import { HistoricalTickBidAsk } from "../api/historical/historicalTickBidAsk";
import { HistoricalTickLast } from "../api/historical/historicalTickLast";
import { CommissionReport } from "../api/report/commissionReport";
import { Execution } from "../api/order/execution";
import { Order } from "../api/order/oder";
import { HistogramEntry } from "../api/historical/histogramEntry";
import { ComboLeg } from "../api/contract/comboLeg";
import { ContractDetails } from "../api/contract/contractDetails";
import { DeltaNeutralContract } from "../api/contract/deltaNeutralContract";
import { OrderState } from "../api/order/orderState";
import { TickType } from "../api/market/tickType";
import { EventName, SoftDollarTier, TagValue, NewsProvider, FamilyCode, DepthMktDataDescription } from "../api/api";

/**
 * @internal
 *
 * Incoming message IDs.
 */
enum MSG_ID {
  TICK_PRICE = 1,
  TICK_SIZE = 2,
  ORDER_STATUS = 3,
  ERR_MSG = 4,
  OPEN_ORDER = 5,
  ACCT_VALUE = 6,
  PORTFOLIO_VALUE = 7,
  ACCT_UPDATE_TIME = 8,
  NEXT_VALID_ID = 9,
  CONTRACT_DATA = 10,
  EXECUTION_DATA = 11,
  MARKET_DEPTH = 12,
  MARKET_DEPTH_L2 = 13,
  NEWS_BULLETINS = 14,
  MANAGED_ACCTS = 15,
  RECEIVE_FA = 16,
  HISTORICAL_DATA = 17,
  BOND_CONTRACT_DATA = 18,
  SCANNER_PARAMETERS = 19,
  SCANNER_DATA = 20,
  TICK_OPTION_COMPUTATION = 21,
  TICK_GENERIC = 45,
  TICK_STRING = 46,
  TICK_EFP = 47,
  CURRENT_TIME = 49,
  REAL_TIME_BARS = 50,
  FUNDAMENTAL_DATA = 51,
  CONTRACT_DATA_END = 52,
  OPEN_ORDER_END = 53,
  ACCT_DOWNLOAD_END = 54,
  EXECUTION_DATA_END = 55,
  DELTA_NEUTRAL_VALIDATION = 56,
  TICK_SNAPSHOT_END = 57,
  MARKET_DATA_TYPE = 58,
  COMMISSION_REPORT = 59,
  POSITION = 61,
  POSITION_END = 62,
  ACCOUNT_SUMMARY = 63,
  ACCOUNT_SUMMARY_END = 64,
  VERIFY_MESSAGE_API = 65,
  VERIFY_COMPLETED = 66,
  DISPLAY_GROUP_LIST = 67,
  DISPLAY_GROUP_UPDATED = 68,
  VERIFY_AND_AUTH_MESSAGE_API = 69,
  VERIFY_AND_AUTH_COMPLETED = 70,
  POSITION_MULTI = 71,
  POSITION_MULTI_END = 72,
  ACCOUNT_UPDATE_MULTI = 73,
  ACCOUNT_UPDATE_MULTI_END = 74,
  SECURITY_DEFINITION_OPTION_PARAMETER = 75,
  SECURITY_DEFINITION_OPTION_PARAMETER_END = 76,
  SOFT_DOLLAR_TIERS = 77,
  FAMILY_CODES = 78,
  SYMBOL_SAMPLES = 79,
  MKT_DEPTH_EXCHANGES = 80,
  TICK_REQ_PARAMS = 81,
  SMART_COMPONENTS = 82,
  NEWS_ARTICLE = 83,
  TICK_NEWS = 84,
  NEWS_PROVIDERS = 85,
  HISTORICAL_NEWS = 86,
  HISTORICAL_NEWS_END = 87,
  HEAD_TIMESTAMP = 88,
  HISTOGRAM_DATA = 89,
  PNL = 94,
  PNL_SINGLE = 95,
  HISTORICAL_TICKS = 96,
  HISTORICAL_TICKS_BID_ASK = 97,
  HISTORICAL_TICKS_LAST = 98,
  TICK_BY_TICK = 99
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

  readonly stack = (new Error()).stack;
  readonly name = "UnderrunError";
}

/**
 * @internal
 *
 * An item on the emit queue.
 */
interface EmitQueueItem {

  /** Event name. */
  name: string;

  /** Event arguments. */
  args: unknown[];
}

/**
 * @internal
 *
 * Class for de-serializing incoming messages and emitting events it to the
 * [[Controller]] event queue.
 */
export class Incoming {

  /**
   * Create an [[Incoming]] object.
   *
   * @param controller The parent [[Controller]] object.
   */
  constructor(private controller: Controller) { }

  /** Data input queue (data that has arrived from server). */
  private dataQueue: string[] = [];

  /** Data emit queue (data to be emitted to controller). */
  private emitQueue: EmitQueueItem[] = [];

  /**
   * Add new tokens to queue.
   */
  enqueue(tokens: string[]): void {
    this.dataQueue = this.dataQueue.concat(tokens);
  }

  /**
   * Process the data queue and emit events.
   */
  process(): void {

    while (true) {

      if (!this.dataQueue.length) {
        break;
      }

      const dataQueueSnapshot = this.dataQueue.slice();

      try {

        // Clear the Emit Queue; if this doesn't get cleared, it piles up whenever there's an error (added by heberallred)

        this.emitQueue = [];

        // dequeue command code token

        const token = this.dequeueInt();

        const constKey = MSG_ID[token];
        if (!constKey) {
          this.controller.emitError(`Received unsupported token: ${constKey} (${token}).`);
          continue;
        }

        if (constKey && this["decodeMsg_"+constKey] !== undefined) {
          this["decodeMsg_"+constKey]();
        } else {
          this.controller.emitError(`No parser implementation found for token: ${constKey} (${token}).`);
        }

      } catch (e) {
        if (!(e instanceof UnderrunError)) {
          throw e;
        }

        // Put data back in the queue, and don't emit any events.

        this.dataQueue = this.dataQueue.concat(dataQueueSnapshot);
        return;
      }

      // Drain emit queue

      const toEmit = this.emitQueue;
      this.emitQueue = [];
      toEmit.forEach((item) => this.controller.emit(item.name, item.args));
    }
  }

  /**
   * De-queue a string value from data queue.
   */
  private dequeue(): string {
    if (this.dataQueue.length === 0) {
      throw new UnderrunError();
    }
    return this.dataQueue.shift();
  }

  /**
   * De-queue a boolean value from data queue.
   */
  private dequeueBool(): boolean {
    return !!parseInt(this.dequeue(), 10);
  }

  /**
   * De-queue a floating point type from data queue.
   */
  private dequeueFloat(): number {
    return parseFloat(this.dequeue());
  }

  /**
   * De-queue an integer type from data queue.
   */
  private dequeueInt() {
    return parseInt(this.dequeue(), 10);
  }

  /**
   * Add tokens to the emit queue.
   */
  private emit(eventName: EventName, ...args: unknown[]) {
    this.emitQueue.push({name: eventName, args: args});
  }

  /**
   * Decode a TICK_PRICE message from data queue and emit a tickPrice and tickSize event.
   */
  private decodeMsg_TICK_PRICE(): void {

    // read from input queue

    const version = this.dequeueInt();
    const tickerId = this.dequeueInt();
    const tickType = this.dequeueInt();
    const price = this.dequeueFloat();

    let size = 0;
    if (version >= 2) {
      size = this.dequeueInt();
    }

    let canAutoExecute = false;
    if (version >= 3) {
      canAutoExecute = this.dequeueBool();
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
          break ;
        case TickType.DELAYED_ASK:
          sizeTickType = TickType.DELAYED_ASK_SIZE;
          break ;
        case TickType.DELAYED_LAST:
          sizeTickType = TickType.DELAYED_LAST_SIZE;
          break ;
      }
    }

    if (sizeTickType !== -1) {
      this.emit(EventName.tickSize, tickerId, sizeTickType, size);
    }
  }

  /**
   * Decode a TICK_SIZE message from data queue and emit an tickSize event.
   */
  private decodeMsg_TICK_SIZE() {
    this.dequeueInt(); // version
    const tickerId = this.dequeueInt();
    const tickType = this.dequeueInt();
    const size = this.dequeueInt();

    this.emit(EventName.tickSize, tickerId, tickType, size);
  }

  /**
   * Decode a ORDER_STATUS message from data queue and emit an orderStatus event.
   */
  private decodeMsg_ORDER_STATUS() {
    const version = this.dequeueInt();
    const id = this.dequeueInt();
    const status = this.dequeue();
    const filled = this.dequeueInt();
    const remaining = this.dequeueInt();
    const avgFillPrice = this.dequeueFloat();

    let permId = 0;
    if (version >= 2) {
      permId = this.dequeueInt();
    }

    let parentId = 0;
    if (version >= 3) {
      parentId = this.dequeueInt();
    }

    let lastFillPrice = 0;
    if (version >= 4) {
      lastFillPrice = this.dequeueFloat();
    }

    let clientId = 0;
    if (version >= 5) {
      clientId = this.dequeueInt();
    }

    let whyHeld = null;
    if (version >= 6) {
      whyHeld = this.dequeue();
    }

    let mktCapPrice = Number.MAX_VALUE;
		if (this.controller.serverVersion >= C.MIN_SERVER_VER.MARKET_CAP_PRICE) {
		    mktCapPrice = this.dequeueFloat();
    }

    this.emit(EventName.orderStatus, id, status, filled, remaining, avgFillPrice,
      permId, parentId, lastFillPrice, clientId, whyHeld, mktCapPrice);
  }

  /**
   * Decode a ERR_MSG message from data queue and emit and error event.
   */
  private decodeMsg_ERR_MSG() {
    const version = this.dequeueInt();
    if (version < 2) {
      const errorMsg = this.dequeue();
      this.controller.emitError(errorMsg);
    } else {
      const id = this.dequeueInt();
      const errorCode = this.dequeueInt();
      const errorMsg = this.dequeue();
      this.controller.emitError(errorMsg, {
        id: id,
        code: errorCode
      });
    }
  }

  /**
   * Decode a OPEN_ORDER message from data queue and emit a openOrder event.
   */
  private decodeMsg_OPEN_ORDER(): void {
    const version = this.dequeueInt();
    const orderId = this.dequeueInt();
    const contract: Contract = this.decodeContract(version);
    const order = this.decodeOrder(version);
    order.orderId = orderId;

    if (version >= 14) {
      contract.comboLegsDescription = this.dequeue();
    }

    if (version >= 29) {
      const comboLegsCount = this.dequeueInt();
      if (comboLegsCount > 0) {
        contract.comboLegs = [];
        for (let i = 0; i < comboLegsCount; ++i) {
          contract.comboLegs.push(this.decodeComboLeg());
        }
      }
      const orderComboLegsCount = this.dequeueInt();
      if (orderComboLegsCount > 0) {
        order.orderComboLegs = [];
        for (let i = 0; i < orderComboLegsCount; ++i) {
          order.orderComboLegs.push({
            price: this.dequeueFloat() || Number.MAX_VALUE
          });
        }
      }
    }

    if (version >= 26) {
      const smartComboRoutingParamsCount = this.dequeueInt();
      if (smartComboRoutingParamsCount > 0) {
        order.smartComboRoutingParams = [];
        for (let i = 0; i < smartComboRoutingParamsCount; ++i) {
          order.smartComboRoutingParams.push({
            tag: this.dequeue(),
            value: this.dequeue()
          });
        }
      }
    }

    if (version >= 20) {
      order.scaleInitLevelSize = this.dequeueInt() || Number.MAX_VALUE;
      order.scaleSubsLevelSize = this.dequeueInt() || Number.MAX_VALUE;
    } else {
      this.dequeueInt(); // notSuppScaleNumComponents
      order.scaleInitLevelSize = this.dequeueInt() || Number.MAX_VALUE;
    }

    order.scalePriceIncrement = this.dequeueFloat() || Number.MAX_VALUE;

    if (version >= 28 && order.scalePriceIncrement > 0.0 && order.scalePriceIncrement !== Number.MAX_VALUE) {
      order.scalePriceAdjustValue = this.dequeueFloat() || Number.MAX_VALUE;
      order.scalePriceAdjustInterval = this.dequeueInt() || Number.MAX_VALUE;
      order.scaleProfitOffset = this.dequeueFloat() || Number.MAX_VALUE;
      order.scaleAutoReset = this.dequeueBool();
      order.scaleInitPosition = this.dequeueInt() || Number.MAX_VALUE;
      order.scaleInitFillQty = this.dequeueInt() || Number.MAX_VALUE;
      order.scaleRandomPercent = this.dequeueBool();
    }

    if (version >= 24) {
      order.hedgeType = this.dequeue();
      if (order.hedgeType?.length) {
        order.hedgeParam = this.dequeue();
      }
    }

    if (version >= 25) {
      order.optOutSmartRouting = this.dequeueBool();
    }

    order.clearingAccount = this.dequeue();
    order.clearingIntent = this.dequeue();

    if (version >= 22) {
      order.notHeld = this.dequeueBool();
    }

    if (version >= 20) {
      if (this.dequeueBool()) {
        contract.deltaNeutralContract = {
          conId: this.dequeueInt(),
          delta: this.dequeueFloat(),
          price: this.dequeueFloat(),
        };
      }
    }
    if (version >= 21) {
      order.algoStrategy = this.dequeue();
      if (order?.algoStrategy.length) {
        const algoParamsCount = this.dequeueInt();
        if (algoParamsCount > 0) {
          order.algoParams = [];
          for (let i = 0; i < algoParamsCount; ++i) {
            order.algoParams.push({
              tag: this.dequeue(),
              value: this.dequeue()
            });
          }
        }
      }
    }

    if (version >= 33) {
      order.solicited = this.dequeueBool();
    }

    order.whatIf = this.dequeueBool();

    const orderState: OrderState = {};

    if (this.controller.serverVersion >= C.MIN_SERVER_VER.WHAT_IF_EXT_FIELDS) {
      orderState.initMarginBefore = this.dequeue();
      orderState.maintMarginBefore = this.dequeue();
      orderState.equityWithLoanBefore = this.dequeue();
      orderState.initMarginChange = this.dequeue();
      orderState.maintMarginChange = this.dequeue();
      orderState.equityWithLoanChange = this.dequeue();
    }

    orderState.initMarginAfter = this.dequeue();
    orderState.maintMarginAfter = this.dequeue();
    orderState.equityWithLoanAfter = this.dequeue();
    orderState.commission = this.dequeueFloat() || Number.MAX_VALUE;
    orderState.minCommission = this.dequeueFloat() || Number.MAX_VALUE;
    orderState.maxCommission = this.dequeueFloat() || Number.MAX_VALUE;
    orderState.minCommission = this.dequeueFloat() || Number.MAX_VALUE;
    orderState.commissionCurrency = this.dequeue();
    orderState.warningText = this.dequeue();

    this.emit(EventName.openOrder, order.orderId, contract, order, orderState);
  }

  /**
   * Decode a OPEN_ORDER message from data queue and emit a updateAccountValue event.
   */
  private decodeMsg_ACCT_VALUE(): void {
    this.dequeueInt(); // version
    const key = this.dequeue();
    const value = this.dequeue();
    const currency = this.dequeue();
    const accountName = this.dequeue();

    this.emit(EventName.updateAccountValue, key, value, currency, accountName);
  }

  /**
   * Decode a PORTFOLIO_VALUE message from data queue and emit a updatePortfolio event.
   */
  private decodeMsg_PORTFOLIO_VALUE(): void {
    const version = this.dequeueInt();

    const contract: Contract = {};
    if (version >= 6) {
      contract.conId = this.dequeueInt();
    }
    contract.symbol = this.dequeue();
    contract.secType = this.dequeue() as SecType;
    contract.lastTradeDateOrContractMonth = this.dequeue();
    contract.strike = this.dequeueFloat();
    contract.right = this.dequeue() as OptionType;

    if (version >= 7) {
      contract.multiplier = this.dequeueInt();
      contract.primaryExch = this.dequeue();
    }

    contract.currency = this.dequeue();

    if (version >= 2) {
      contract.localSymbol = this.dequeue();
    }

    if (version >= 8) {
      contract.tradingClass = this.dequeue();
    }

    let position: number;
    if (this.controller.serverVersion >= C.MIN_SERVER_VER.FRACTIONAL_POSITIONS) {
      position = this.dequeueFloat();
    } else {
      position = this.dequeueInt();
    }

    const marketPrice = this.dequeueFloat();
    const marketValue = this.dequeueFloat();
    let averageCost = Number.MAX_VALUE;
    let unrealizedPNL = Number.MAX_VALUE;
    let realizedPNL = Number.MAX_VALUE;
    if (version >= 3) {
      averageCost = this.dequeueFloat();
      unrealizedPNL = this.dequeueFloat();
      realizedPNL = this.dequeueFloat();
    }

    let accountName: string = undefined;
    if (version >= 4) {
      accountName = this.dequeue();
    }

    if (version === 6 && this.controller.serverVersion === 39) {
      contract.primaryExch = this.dequeue();
    }

    this.emit(EventName.updatePortfolio, contract, position, marketPrice, marketValue,
      averageCost, unrealizedPNL, realizedPNL, accountName);
  }

  /**
   * Decode a ACCT_UPDATE_TIME message from data queue and emit a updateAccountTime event.
   */
  private decodeMsg_ACCT_UPDATE_TIME(): void {
    this.dequeueInt(); // version
    const timeStamp = this.dequeue();

    this.emit(EventName.updateAccountTime, timeStamp);
  }

  /**
   * Decode a NEXT_VALID_ID message from data queue and emit a nextValidId event.
   */
  private decodeMsg_NEXT_VALID_ID(): void {
    this.dequeueInt(); // version
    const orderId = this.dequeueInt();

    this.emit(EventName.nextValidId, orderId);
  }

  /**
   * Decode a CONTRACT_DATA message from data queue and emit a contractDetails event.
   */
  private decodeMsg_CONTRACT_DATA(): void {
    const version = this.dequeueInt();

    let reqId = -1;
    if (version >= 3) {
      reqId = this.dequeueInt();
    }

    const contract: ContractDetails = {
      contract: {}
    };

    contract.contract.symbol = this.dequeue();
    contract.contract.secType = this.dequeue() as SecType;
    this.readLastTradeDate(contract, false);
    contract.contract.strike = this.dequeueFloat();
    contract.contract.right = this.dequeue() as OptionType;
    contract.contract.exchange = this.dequeue();
    contract.contract.currency = this.dequeue();
    contract.contract.localSymbol = this.dequeue();
    contract.marketName = this.dequeue();
    contract.contract.tradingClass = this.dequeue();
    contract.contract.conId = this.dequeueInt();
    contract.minTick = this.dequeueFloat();
    if (this.controller.serverVersion >= C.MIN_SERVER_VER.MD_SIZE_MULTIPLIER) {
			contract.mdSizeMultiplier = this.dequeueInt();
		}
    contract.contract.multiplier = this.dequeueInt();
    contract.orderTypes = this.dequeue();
    contract.validExchanges = this.dequeue();

    if (version >= 2) {
      contract.priceMagnifier = this.dequeueInt();
    }

    if (version >= 4) {
      contract.underConId = this.dequeueInt();
    }

    if (version >= 5) {
      contract.longName = this.dequeue();
      contract.contract.primaryExch = this.dequeue();
    }

    if (version >= 6) {
      contract.contractMonth = this.dequeue();
      contract.industry = this.dequeue();
      contract.category = this.dequeue();
      contract.subcategory = this.dequeue();
      contract.timeZoneId = this.dequeue();
      contract.tradingHours = this.dequeue();
      contract.liquidHours = this.dequeue();
    }

    if (version >= 8) {
      contract.evRule = this.dequeue();
      contract.evMultiplier = this.dequeueFloat();
    }

    if (version >= 7) {
      const secIdListCount = this.dequeueInt();
      if (secIdListCount > 0) {
        contract.secIdList = [];
        for (let i = 0; i < secIdListCount; ++i) {
          const tagValue: TagValue = {
            tag: this.dequeue(),
            value: this.dequeue()
          };
          contract.secIdList.push(tagValue);
        }
      }

      if (this.controller.serverVersion >= C.MIN_SERVER_VER.AGG_GROUP) {
        contract.aggGroup = this.dequeueInt();
      }

      if (this.controller.serverVersion >= C.MIN_SERVER_VER.UNDERLYING_INFO) {
        contract.underSymbol = this.dequeue();
        contract.underSecType = this.dequeue();
      }

      if (this.controller.serverVersion >= C.MIN_SERVER_VER.MARKET_RULES) {
        contract.marketRuleIds = this.dequeue();
      }

      if (this.controller.serverVersion >= C.MIN_SERVER_VER.REAL_EXPIRATION_DATE) {
        contract.realExpirationDate = this.dequeue();
      }
    }

    this.emit(EventName.contractDetails, reqId, contract);
  }

  /**
   * Decode a EXECUTION_DATA message from data queue and emit a execDetails event.
   */
  private decodeMsg_EXECUTION_DATA(): void {

    let version = this.controller.serverVersion;
    if (version < C.MIN_SERVER_VER.LAST_LIQUIDITY) {
      version = this.dequeueInt();
    }

    let reqId = -1;
    if (version >= 7) {
      reqId = this.dequeueInt();
    }

    const orderId = this.dequeueInt();

    // read contract fields
    const contract: Contract = {};

    if (version >= 5) {
      contract.conId = this.dequeueInt();
    }

    contract.symbol = this.dequeue();
    contract.secType = this.dequeue() as SecType;
    contract.lastTradeDateOrContractMonth = this.dequeue();
    contract.strike = this.dequeueFloat();
    contract.right = this.dequeue() as OptionType;

    if (version >= 9) {
      contract.multiplier = this.dequeueInt();
    }

    contract.exchange = this.dequeue();
    contract.currency = this.dequeue();
    contract.localSymbol = this.dequeue();

    if (version >= 10) {
      contract.tradingClass = this.dequeue();
    }

    const exec: Execution = {};

    exec.orderId = orderId;
    exec.execId = this.dequeue();
    exec.time = this.dequeue();
    exec.acctNumber = this.dequeue();
    exec.exchange = this.dequeue();
    exec.side = this.dequeue();
    exec.shares = this.dequeueInt();
    exec.price = this.dequeueFloat();

    if (version >= 2) {
      exec.permId = this.dequeueInt();
    }

    if (version >= 3) {
      exec.clientId = this.dequeueInt();
    }

    if (version >= 4) {
      exec.liquidation = this.dequeueInt();
    }

    if (version >= 6) {
      exec.cumQty = this.dequeueInt();
      exec.avgPrice = this.dequeueFloat();
    }

    if (version >= 8) {
      exec.orderRef = this.dequeue();
    }

    if (version >= 9) {
      exec.evRule = this.dequeue();
      exec.evMultiplier = this.dequeueFloat();
    }

    if (this.controller.serverVersion >= C.MIN_SERVER_VER.MODELS_SUPPORT) {
			exec.modelCode = this.dequeue();
		}

    if (this.controller.serverVersion >= C.MIN_SERVER_VER.LAST_LIQUIDITY) {
        exec.lastLiquidity = { value: this.dequeueInt() };
    }

    this.emit(EventName.execDetails, reqId, contract, exec);
  }

  /**
   * Decode a MARKET_DEPTH message from data queue and emit a updateMktDepth event.
   */
  private decodeMsg_MARKET_DEPTH(): void {
    this.dequeueInt(); // version
    const id = this.dequeueInt();
    const position = this.dequeueInt();
    const operation = this.dequeueInt();
    const side = this.dequeueInt();
    const price = this.dequeueFloat();
    const size = this.dequeueInt();

    this.emit(EventName.updateMktDepth, id, position, operation, side, price, size);
  }

  /**
   * Decode a MARKET_DEPTH_L2 message from data queue and emit a updateMktDepthL2 event.
   */
  private decodeMsg_MARKET_DEPTH_L2(): void {
    this.dequeueInt(); // version
    const id = this.dequeueInt();
    const position = this.dequeueInt();
    const operation = this.dequeueInt();
    const side = this.dequeueInt();
    const price = this.dequeueFloat();
    const size = this.dequeueInt();

    let isSmartDepth = false;
    if (this.controller.serverVersion >= C.MIN_SERVER_VER.SMART_DEPTH) {
      isSmartDepth = this.dequeueBool();
    }

    this.emit(EventName.updateMktDepthL2, id, position, operation, side, price, size, isSmartDepth);
  }

  /**
   * Decode a NEWS_BULLETINS message from data queue and emit a updateNewsBulletin event.
   */
  private decodeMsg_NEWS_BULLETINS(): void {
    this.dequeueInt(); // version
    const newsMsgId = this.dequeueInt();
    const newsMsgType = this.dequeueInt();
    const newsMessage = this.dequeue();
    const originatingExch = this.dequeue();

    this.emit(EventName.updateNewsBulletin, newsMsgId, newsMsgType, newsMessage, originatingExch);
  }

  /**
   * Decode a MANAGED_ACCTS message from data queue and emit a managedAccounts event.
   */
  private decodeMsg_MANAGED_ACCTS(): void {
    this.dequeueInt(); // version
    const accountsList = this.dequeue();

    this.emit(EventName.managedAccounts, accountsList);
  }

  /**
   * Decode a RECEIVE_FA message from data queue and emit a receiveFA event.
   */
  private decodeMsg_RECEIVE_FA(): void {
    this.dequeueInt(); // version
    const faDataType = this.dequeueInt();
    const xml = this.dequeue();

    this.emit(EventName.receiveFA, faDataType, xml);
  }

  /**
   * Decode a HISTORICAL_DATA message from data queue and emit historicalData events.
   */
  private decodeMsg_HISTORICAL_DATA() {
    let version = Number.MAX_VALUE;
    if (this.controller.serverVersion < C.MIN_SERVER_VER.SYNT_REALTIME_BARS) {
      version = this.dequeueInt();
    }

    const reqId = this.dequeueInt();

    let completedIndicator = "finished";
    let startDateStr = "";
    let endDateStr = "";
    if (version >= 2) {
      startDateStr = this.dequeue();
      endDateStr = this.dequeue();
      completedIndicator += "-" + startDateStr + "-" + endDateStr;
    }

    let itemCount = this.dequeueInt();

    while (itemCount--) {
      const date = this.dequeue();
      const open = this.dequeueFloat();
      const high = this.dequeueFloat();
      const low = this.dequeueFloat();
      const close = this.dequeueFloat();
      const volume = this.dequeueInt();
      const WAP = this.dequeueFloat();
      const hasGaps = this.dequeueBool();

      let barCount = -1;
      if (version >= 3) {
        barCount = this.dequeueInt();
      }

      this.emit(EventName.historicalData, reqId, date, open, high, low, close, volume, barCount, WAP, hasGaps);
    }

    // send end of dataset marker
    this.emit(EventName.historicalData, reqId, completedIndicator, -1, -1, -1, -1, -1, -1, -1, false);
  }

  /**
   * Decode a BOND_CONTRACT_DATA message from data queue and emit a bondContractDetails event.
   */
  private decodeMsg_BOND_CONTRACT_DATA(): void {
    const version = this.dequeueInt();

    let reqId = -1;
    if (version >= 3) {
      reqId = this.dequeueInt();
    }

    const contract: ContractDetails = {
      contract: {}
    };

    contract.contract.symbol = this.dequeue();
    contract.contract.secType = this.dequeue() as SecType;
    contract.cusip = this.dequeue();
    contract.coupon = this.dequeueFloat();
    this.readLastTradeDate(contract, true);
    contract.issueDate = this.dequeue();
    contract.ratings = this.dequeue();
    contract.bondType = this.dequeue();
    contract.couponType = this.dequeue();
    contract.convertible = this.dequeueBool();
    contract.callable = this.dequeueBool();
    contract.putable = this.dequeueBool();
    contract.descAppend = this.dequeue();
    contract.contract.exchange = this.dequeue();
    contract.contract.currency = this.dequeue();
    contract.marketName = this.dequeue();
    contract.contract.tradingClass = this.dequeue();
    contract.contract.conId = this.dequeueInt();
    contract.minTick = this.dequeueFloat();
    if (this.controller.serverVersion >= C.MIN_SERVER_VER.MD_SIZE_MULTIPLIER) {
      contract.mdSizeMultiplier = this.dequeueInt();
    }
    contract.orderTypes = this.dequeue();
    contract.validExchanges = this.dequeue();

    if (version >= 2) {
      contract.nextOptionDate = this.dequeue();
      contract.nextOptionType = this.dequeue();
      contract.nextOptionPartial = this.dequeueBool();
      contract.notes = this.dequeue();
    }

    if (version >= 4) {
      contract.longName = this.dequeue();
    }

    if (version >= 6) {
      contract.evRule = this.dequeue();
      contract.evMultiplier = this.dequeueFloat();
    }

    if (version >= 5) {
      let secIdListCount = this.dequeueInt();
      if (secIdListCount > 0) {
        contract.secIdList = [];
        while (secIdListCount--) {
          const tagValue: TagValue = {
            tag: this.dequeue(),
            value: this.dequeue()
          };
          contract.secIdList.push(tagValue);
        }
      }
    }

    if (this.controller.serverVersion >= C.MIN_SERVER_VER.AGG_GROUP) {
      contract.aggGroup = this.dequeueInt();
    }

    if (this.controller.serverVersion >= C.MIN_SERVER_VER.MARKET_RULES) {
      contract.marketRuleIds = this.dequeue();
    }

    this.emit(EventName.bondContractDetails, reqId, contract);
  }

  /**
   * Decode a SCANNER_PARAMETERS message from data queue and emit a scannerParameters event.
   */
  private decodeMsg_SCANNER_PARAMETERS(): void {
    this.dequeueInt(); // version
    const xml = this.dequeue();

    this.emit(EventName.scannerParameters, xml);
  }

  /**
   * Decode a SCANNER_DATA message from data queue and emit a scannerData and scannerDataEnd event.
   */
  private decodeMsg_SCANNER_DATA(): void {
    const version = this.dequeueInt();
    const tickerId = this.dequeueInt();
    let numberOfElements = this.dequeueInt();

    while (numberOfElements--) {
      const contract: ContractDetails = {
        contract: {}
      };

      const rank = this.dequeueInt();
      if (version >= 3) {
        contract.contract.conId = this.dequeueInt();
      }

      contract.contract.symbol = this.dequeue();
      contract.contract.secType = this.dequeue() as SecType;
      this.readLastTradeDate(contract, false);
      contract.contract.strike = this.dequeueFloat();
      contract.contract.right = this.dequeue() as OptionType;
      contract.contract.exchange = this.dequeue();
      contract.contract.currency = this.dequeue();
      contract.contract.localSymbol = this.dequeue();
      contract.marketName = this.dequeue();
      contract.contract.tradingClass = this.dequeue();

      const distance = this.dequeue();
      const benchmark = this.dequeue();
      const projection = this.dequeue();

      let legsStr = undefined;
      if (version >= 2) {
        legsStr = this.dequeue();
      }

      this.emit(EventName.scannerData, tickerId, rank, contract, distance,
        benchmark, projection, legsStr);
    }

    this.emit(EventName.scannerDataEnd, tickerId);
  }

  /**
   * Decode a TICK_OPTION_COMPUTATION message from data queue and emit a tickOptionComputation event.
   */
  private decodeMsg_TICK_OPTION_COMPUTATION(): void {
    const version = this.dequeueInt();
    const tickerId = this.dequeueInt();
    const tickType = this.dequeueInt();

    let impliedVol = this.dequeueFloat();
    if (impliedVol == -1) {  // -1 is the "not yet computed" indicator
      impliedVol = Number.MAX_VALUE;
    }

    let delta = this.dequeueFloat();
    if (delta == -2) {  // -2 is the "not yet computed" indicator
      delta = Number.MAX_VALUE;
    }

    let optPrice = Number.MAX_VALUE;
    let pvDividend = Number.MAX_VALUE;
    let gamma = Number.MAX_VALUE;
    let vega = Number.MAX_VALUE;
    let theta = Number.MAX_VALUE;
    let undPrice = Number.MAX_VALUE;

    if (version >= 6 || tickType === TickType.MODEL_OPTION || tickType === TickType.DELAYED_MODEL_OPTION) {
      optPrice = this.dequeueFloat();
      if (optPrice == -1) {  // -1 is the "not yet computed" indicator
        optPrice = Number.MAX_VALUE;
      }

      pvDividend = this.dequeueFloat();
      if (pvDividend == -1) {  // -1 is the "not yet computed" indicator
        pvDividend = Number.MAX_VALUE;
      }
    }

    if (version >= 6) {
      gamma = this.dequeueFloat();
      if (gamma == -2) {  // -2 is the "not yet computed" indicator
        gamma = Number.MAX_VALUE;
      }

      vega = this.dequeueFloat();
      if (vega == -2) {  // -2 is the "not yet computed" indicator
        vega = Number.MAX_VALUE;
      }

      theta = this.dequeueFloat();
      if (theta == -2) {  // -2 is the "not yet computed" indicator
        theta = Number.MAX_VALUE;
      }

      undPrice = this.dequeueFloat();
      if (undPrice == -1) {  // -1 is the "not yet computed" indicator
        undPrice = Number.MAX_VALUE;
      }
    }

    this.emit(EventName.tickOptionComputation, tickerId, tickType, impliedVol, delta, optPrice, pvDividend, gamma, vega, theta, undPrice);
  }

  /**
   * Decode a TICK_GENERIC message from data queue and emit a tickGeneric event.
   */
  private decodeMsg_TICK_GENERIC(): void {
    this.dequeueInt(); // version
    const tickerId = this.dequeueInt();
    const tickType = this.dequeueInt();
    const value = this.dequeueFloat();

    this.emit(EventName.tickGeneric, tickerId, tickType, value);
  }

  /**
   * Decode a TICK_STRING message from data queue and emit a tickString event.
   */
  private decodeMsg_TICK_STRING(): void {
    this.dequeueInt(); // version
    const tickerId = this.dequeueInt();
    const tickType = this.dequeueInt();
    const value = this.dequeue();

    this.emit(EventName.tickString, tickerId, tickType, value);
  }

  /**
   * Decode a TICK_EFP message from data queue and emit a tickEFP event.
   */
  private decodeMsg_TICK_EFP(): void {
    this.dequeueInt(); // version
    const tickerId = this.dequeueInt();
    const tickType = this.dequeueInt();
    const basisPoints = this.dequeueFloat();
    const formattedBasisPoints = this.dequeue();
    const impliedFuturesPrice = this.dequeueFloat();
    const holdDays = this.dequeueInt();
    const futureExpiry = this.dequeue();
    const dividendImpact = this.dequeueFloat();
    const dividendsToExpiry = this.dequeueFloat();

    this.emit(EventName.tickEFP, tickerId, tickType, basisPoints, formattedBasisPoints,
      impliedFuturesPrice, holdDays, futureExpiry,
      dividendImpact, dividendsToExpiry);
  }

  /**
   * Decode a CURRENT_TIME message from data queue and emit a currentTime event.
   */
  private decodeMsg_CURRENT_TIME(): void {
    this.dequeueInt(); //  version
    const time = this.dequeueInt();

    this.emit(EventName.currentTime, time);
  }

  /**
   * Decode a REAL_TIME_BARS message from data queue and emit a realtimeBar event.
   */
  private decodeMsg_REAL_TIME_BARS(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();
    const time = this.dequeueInt();
    const open = this.dequeueFloat();
    const high = this.dequeueFloat();
    const low = this.dequeueFloat();
    const close = this.dequeueFloat();
    const volume = this.dequeueInt();
    const wap = this.dequeueFloat();
    const count = this.dequeueInt();

    this.emit(EventName.realtimeBar, reqId, time, open, high, low, close, volume, wap, count);
  }

  /**
   * Decode a REAL_TIME_BARS message from data queue and emit a fundamentalData event.
   */
  private decodeMsg_FUNDAMENTAL_DATA(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();
    const data = this.dequeue();

    this.emit(EventName.fundamentalData, reqId, data);
  }

  /**
   * Decode a CONTRACT_DATA_END message from data queue and emit a contractDetailsEnd event.
   */
  private decodeMsg_CONTRACT_DATA_END(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();

    this.emit(EventName.contractDetailsEnd, reqId);
  }

  /**
   * Decode a OPEN_ORDER_END message from data queue and emit a openOrderEnd event.
   */
  private decodeMsg_OPEN_ORDER_END(): void {
    this.dequeueInt(); // version

    this.emit(EventName.openOrderEnd);
  }

  /**
   * Decode a ACCT_DOWNLOAD_END  message from data queue and emit a accountDownloadEnd event.
   */
  private decodeMsg_ACCT_DOWNLOAD_END(): void {
    this.dequeueInt(); // version
    const accountName = this.dequeue();

    this.emit(EventName.accountDownloadEnd, accountName);
  }

  /**
   * Decode a EXECUTION_DATA_END  message from data queue and emit a execDetailsEnd event.
   */
  private decodeMsg_EXECUTION_DATA_END(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();

    this.emit(EventName.execDetailsEnd, reqId);
  }

  /**
   * Decode a DELTA_NEUTRAL_VALIDATION message from data queue and emit a deltaNeutralValidation event.
   */
  private decodeMsg_DELTA_NEUTRAL_VALIDATION(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();
    const underComp: DeltaNeutralContract = {
      conId: this.dequeueInt(),
      delta: this.dequeueFloat(),
      price: this.dequeueFloat()
    };

    this.emit(EventName.deltaNeutralValidation, reqId, underComp);
  }

  /**
   * Decode a TICK_SNAPSHOT_END message from data queue and emit a tickSnapshotEnd event.
   */
  private decodeMsg_TICK_SNAPSHOT_END(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();

    this.emit(EventName.tickSnapshotEnd, reqId);
  }

  /**
   * Decode a MARKET_DATA_TYPE message from data queue and emit a marketDataType event.
   */
  private decodeMsg_MARKET_DATA_TYPE(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();
    const marketDataType = this.dequeueInt();

    this.emit(EventName.marketDataType, reqId, marketDataType);
  }


  /**
   * Decode a COMMISSION_REPORT message from data queue and emit a commissionReport event.
   */
  private decodeMsg_COMMISSION_REPORT(): void {
    this.dequeueInt(); // version

    const commissionReport: CommissionReport = {};
    commissionReport.execId = this.dequeue();
    commissionReport.commission = this.dequeueFloat();
    commissionReport.currency = this.dequeue();
    commissionReport.realizedPNL = this.dequeueFloat();
    commissionReport.yield = this.dequeueFloat();
    commissionReport.yieldRedemptionDate = this.dequeueInt();

    this.emit(EventName.commissionReport, commissionReport);
  }

  /**
   * Decode a POSITION message from data queue and emit a position event.
   */
  private decodeMsg_POSITION(): void {
    const version = this.dequeueInt();
    const account = this.dequeue();
    const contract: Contract = {};

    contract.conId = this.dequeueInt();
    contract.symbol = this.dequeue();
    contract.secType = this.dequeue() as SecType;
    contract.lastTradeDateOrContractMonth = this.dequeue();
    contract.strike = this.dequeueFloat();
    contract.right = this.dequeue() as OptionType;
    contract.multiplier = this.dequeueInt();
    contract.exchange = this.dequeue();
    contract.currency = this.dequeue();
    contract.localSymbol = this.dequeue();
    if (version >= 2) {
      contract.tradingClass = this.dequeue();
    }

    const pos = this.controller.serverVersion >= C.MIN_SERVER_VER.FRACTIONAL_POSITIONS ? this.dequeueFloat() : this.dequeueInt();

    let avgCost = 0;
    if (version >= 3) {
      avgCost = this.dequeueFloat();
    }

    this.emit(EventName.position, account, contract, pos, avgCost);
  }

  /**
   * Decode a POSITION_END message from data queue and emit a positionEnd event.
   */
  private decodeMsg_POSITION_END(): void {
    this.dequeueInt(); // version

    this.emit(EventName.positionEnd);
  }

  /**
   * Decode a ACCOUNT_SUMMARY message from data queue and emit a accountSummary event.
   */
  private decodeMsg_ACCOUNT_SUMMARY() {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();
    const account = this.dequeue();
    const tag = this.dequeue();
    const value = this.dequeue();
    const currency = this.dequeue();

    this.emit(EventName.accountSummary, reqId, account, tag, value, currency);
  }

  /**
   * Decode a ACCOUNT_SUMMARY message from data queue and emit a accountSummaryEnd event.
   */
  private decodeMsg_ACCOUNT_SUMMARY_END(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();

    this.emit(EventName.accountSummaryEnd, reqId);
  }

  /**
   * Decode a DISPLAY_GROUP_LIST message from data queue and emit a displayGroupList event.
   */
  private decodeMsg_DISPLAY_GROUP_LIST(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();
    const list = this.dequeue();

    this.emit(EventName.displayGroupList, reqId, list);
  }

  /**
   * Decode a DISPLAY_GROUP_UPDATED message from data queue and emit a displayGroupUpdated event.
   */
  private decodeMsg_DISPLAY_GROUP_UPDATED(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();
    const contractInfo = this.dequeue();

    this.emit(EventName.displayGroupUpdated, reqId, contractInfo);
  }

  /**
   * Decode a POSITION_MULTI message from data queue and emit a accountSummary event.
   */
  private decodeMsg_POSITION_MULTI(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();
    const account = this.dequeue();
    const modelCode = null;
    const contract: Contract = {};

    contract.conId = this.dequeueInt();
    contract.symbol = this.dequeue();
    contract.secType = this.dequeue() as SecType;
    contract.lastTradeDateOrContractMonth = this.dequeue();
    contract.strike = this.dequeueFloat();
    contract.right = this.dequeue() as OptionType;
    contract.multiplier = this.dequeueInt();
    contract.exchange = this.dequeue();
    contract.currency = this.dequeue();
    contract.localSymbol = this.dequeue();
    contract.tradingClass = this.dequeue();
    const pos = this.dequeueInt();
    const avgCost = this.dequeueFloat();

    this.emit(EventName.positionMulti, reqId, account, modelCode, contract, pos, avgCost);
  }

  /**
   * Decode a POSITION_MULTI_END message from data queue and emit a positionMultiEnd event.
   */
  private decodeMsg_POSITION_MULTI_END(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();

    this.emit(EventName.positionMultiEnd, reqId);
  }

  /**
   * Decode a ACCOUNT_UPDATE_MULTI message from data queue and emit a accountUpdateMulti event.
   */
  private decodeMsg_ACCOUNT_UPDATE_MULTI(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeueInt();
    const account = this.dequeue();
    const modelCode = this.dequeue();
    const key = this.dequeue();
    const value = this.dequeue();
    const currency = this.dequeue();

    this.emit(EventName.accountUpdateMulti, reqId, account, modelCode, key, value, currency);
  }

  /**
   * Decode a ACCOUNT_UPDATE_MULTI_END message from data queue and emit a accountUpdateMultiEnd event.
   */
  private decodeMsg_ACCOUNT_UPDATE_MULTI_END(): void {
    this.dequeueInt(); // version
    const reqId = this.dequeue();

    this.emit(EventName.accountUpdateMultiEnd, reqId);
  }

  /**
   * Decode a SECURITY_DEFINITION_OPTION_PARAMETER message from data queue and emit a securityDefinitionOptionParameter event.
   */
  private decodeMsg_SECURITY_DEFINITION_OPTION_PARAMETER(): void {
    const reqId = this.dequeueInt();
    const exchange = this.dequeue();
    const underlyingConId = this.dequeueInt();
    const tradingClass = this.dequeue();
    const multiplier = this.dequeue();
    const expCount = this.dequeueInt();
    const expirations = [];

    for (let i = 0; i < expCount; i++) {
      expirations.push(this.dequeue());
    }

    const strikeCount = this.dequeueInt();
    const strikes = [];
    for (let j = 0; j < strikeCount; j++) {
      strikes.push(this.dequeueFloat());
    }

    this.emit(EventName.securityDefinitionOptionParameter, reqId, exchange, underlyingConId, tradingClass, multiplier, expirations, strikes);
  }

  /**
   * Decode a SECURITY_DEFINITION_OPTION_PARAMETER_END message from data queue and emit a securityDefinitionOptionParameterEnd event.
   */
  private decodeMsg_SECURITY_DEFINITION_OPTION_PARAMETER_END(): void {
    const reqId = this.dequeueInt();

    this.emit(EventName.securityDefinitionOptionParameterEnd, reqId);
  }

  /**
   * Decode a SOFT_DOLLAR_TIERS message from data queue and emit a softDollarTiers event.
   */
  private decodeMsg_SOFT_DOLLAR_TIERS(): void {
    const reqId = this.dequeueInt();
    const nTiers = this.dequeueInt();

		const tiers: SoftDollarTier[] = new Array(nTiers);
		for (let i = 0; i < nTiers; i++) {
			tiers[i] = {
        name: this.dequeue(),
        value: this.dequeue(),
        displayName: this.dequeue()
      };
    }

    this.emit(EventName.softDollarTiers, reqId, tiers);
  }

  /**
   * Decode a FAMILY_CODES message from data queue and emit a familyCodes event.
   */
  private decodeMsg_FAMILY_CODES(): void {
    const nFamilyCodes = this.dequeueInt();

		const familyCodes: FamilyCode[] = new Array(nFamilyCodes);
		for (let i = 0; i < nFamilyCodes; i++) {
			familyCodes[i] = {
        accountID: this.dequeue(),
        familyCode: this.dequeue()
      };
    }

    this.emit(EventName.familyCodes, familyCodes);
  }

  /**
   * Decode a SYMBOL_SAMPLES message from data queue and emit a symbolSamples event.
   */
  private decodeMsg_SYMBOL_SAMPLES(): void {
    const reqId = this.dequeueInt();

    const nContractDescriptions = this.dequeueInt();
    const contractDescriptions: ContractDescription[] = new Array(nContractDescriptions);
    for (let i = 0; i < nContractDescriptions; i++) {
      const contract: Contract = {
        conId: this.dequeueInt(),
        symbol:  this.dequeue(),
        secType: this.dequeue() as SecType,
        primaryExch: this.dequeue(),
         currency: this.dequeue()
      };

      const nDerivativeSecTypes = this.dequeueInt();
      const derivativeSecTypes: SecType[] = new Array(nDerivativeSecTypes);
      for (let j = 0; j < nDerivativeSecTypes; j++) {
        derivativeSecTypes[j] = this.dequeue() as SecType;
      }

      contractDescriptions[i] = {
        contract: contract,
        derivativeSecTypes: derivativeSecTypes
      };
    }

    this.emit(EventName.symbolSamples, reqId,contractDescriptions);
  }

  /**
   * Decode a MKT_DEPTH_EXCHANGES message from data queue and emit a mktDepthExchanges event.
   */
  private decodeMsg_MKT_DEPTH_EXCHANGES(): void {
    const nDepthMktDataDescriptions = this.dequeueInt();
    const depthMktDataDescriptions: DepthMktDataDescription[] = new Array(nDepthMktDataDescriptions);
    for (let i = 0; i < nDepthMktDataDescriptions; i++) {
      if (this.controller.serverVersion >= C.MIN_SERVER_VER.SERVICE_DATA_TYPE) {
        depthMktDataDescriptions[i] = {
          exchange: this.dequeue(),
          secType: this.dequeue() as SecType,
          listingExch: this.dequeue(),
          serviceDataType: this.dequeue(),
          aggGroup: this.dequeueInt() || Number.MAX_VALUE
        };
      } else {
        depthMktDataDescriptions[i] = {
          exchange: this.dequeue(),
          secType: this.dequeue() as SecType,
          listingExch: "",
          serviceDataType: this.dequeueBool() ? "Deep2" : "Deep",
          aggGroup: Number.MAX_VALUE
        };
      }
    }

    this.emit(EventName.mktDepthExchanges, depthMktDataDescriptions);
  }

  /**
   * Decode a TICK_REQ_PARAMS message from data queue and emit a tickReqParams event.
   */
  private decodeMsg_TICK_REQ_PARAMS(): void {
    const tickerId = this.dequeueInt();
    const minTick = this.dequeueInt();
    const bboExchange = this.dequeue();
    const snapshotPermissions = this.dequeueInt();

    this.emit(EventName.tickReqParams, tickerId, minTick, bboExchange, snapshotPermissions);
  }

  /**
   * Decode a SMART_COMPONENTS message from data queue and emit a smartComponents event.
   */
  private decodeMsg_SMART_COMPONENTS(): void {
    const reqId = this.dequeueInt();
    const nCount = this.dequeueInt();

    const theMap: Map<number, [string, string]> = new Map();
    for (let i = 0; i < nCount; i++) {
      const bitNumber = this.dequeueInt();
      const exchange = this.dequeue();
      const exchangeLetter = this.dequeue();
      theMap.set(bitNumber, [exchange, exchangeLetter]);
    }

    this.emit(EventName.smartComponents, reqId, theMap);
  }

  /**
   * Decode a NEWS_ARTICLE message from data queue and emit a newsArticle event.
   */
  private decodeMsg_NEWS_ARTICLE(): void {
    const reqId = this.dequeueInt();
    const articleType = this.dequeueInt();
    const articleText = this.dequeue();

    this.emit(EventName.newsArticle, reqId, articleType, articleText);
  }

  /**
   * Decode a TICK_NEWS message from data queue and emit a tickNews event.
   */
  private decodeMsg_TICK_NEWS(): void {
    const tickerId = this.dequeueInt();
    const timeStamp = this.dequeueInt();
    const providerCode = this.dequeue();
    const articleId = this.dequeue();
    const headline = this.dequeue();
    const extraData = this.dequeue();

    this.emit(EventName.tickNews, tickerId, timeStamp, providerCode, articleId, headline, extraData);
  }

  /**
   * Decode a NEWS_PROVIDERS message from data queue and emit a newsProviders event.
   */
  private decodeMsg_NEWS_PROVIDERS(): void {
    const nNewsProviders = this.dequeueInt();
    const newProviders: NewsProvider[] = new Array(nNewsProviders);
    for (let i = 0; i < nNewsProviders; i++) {
      newProviders[i] = {
        providerCode: this.dequeue(),
        providerName: this.dequeue()
      };
    }

    this.emit(EventName.newsProviders, newProviders);
  }

  /**
   * Decode a HISTORICAL_NEWS message from data queue and emit a historicalNews event.
   */
  private decodeMsg_HISTORICAL_NEWS(): void {
    const nNewsProviders = this.dequeueInt();
    const newProviders: NewsProvider[] = new Array(nNewsProviders);
    for (let i = 0; i < nNewsProviders; i++) {
      newProviders[i] = {
        providerCode: this.dequeue(),
        providerName: this.dequeue()
      };
    }

    this.emit(EventName.historicalNews, newProviders);
  }

  /**
   * Decode a HISTORICAL_NEWS_END message from data queue and emit a historicalNewsEnd event.
   */
  private decodeMsg_HISTORICAL_NEWS_END(): void {
    const reqId = this.dequeueInt();
    const hasMore = this.dequeueBool();

    this.emit(EventName.historicalNewsEnd, reqId, hasMore);
  }

  /**
   * Decode a HEAD_TIMESTAMP message from data queue and emit a headTimestamp event.
   */
  private decodeMsg_HEAD_TIMESTAMP(): void {
    const reqId = this.dequeueInt();
    const headTimestamp = this.dequeue();

    this.emit(EventName.headTimestamp, reqId, headTimestamp);
  }

  /**
   * Decode a HISTOGRAM_DATA message from data queue and emit a histogramData event.
   */
  private decodeMsg_HISTOGRAM_DATA(): void {
    const reqId = this.dequeueInt();
    const count = this.dequeueInt();

    const items: HistogramEntry[] = new Array(count);
    for (let i = 0; i < count; i++) {
      items[i] = {
        price:  this.dequeueFloat(),
        size: this.dequeueInt()
      };
    }

    this.emit(EventName.histogramData, reqId, items);
  }

  /**
   * Decode a PNL message from data queue and emit a pnl event.
   */
  private decodeMsg_PNL(): void {
    const reqId = this.dequeueInt();
    const dailyPnL = this.dequeueFloat();

    let unrealizedPnL = Number.MAX_VALUE;
    let realizedPnL = Number.MAX_VALUE;

    if (this.controller.serverVersion >= C.MIN_SERVER_VER.UNREALIZED_PNL) {
      unrealizedPnL = this.dequeueFloat();
    }
    if (this.controller.serverVersion >= C.MIN_SERVER_VER.REALIZED_PNL) {
      realizedPnL = this.dequeueFloat();
    }

    this.emit(EventName.pnl, reqId, dailyPnL, unrealizedPnL, realizedPnL);
  }

  /**
   * Decode a PNL_SINGLE message from data queue and emit a pnlSingle event.
   */
  private decodeMsg_PNL_SINGLE(): void {
    const reqId = this.dequeueInt();
    const pos = this.dequeueInt();
    const dailyPnL = this.dequeueFloat();

    let unrealizedPnL = Number.MAX_VALUE;
    let realizedPnL = Number.MAX_VALUE;

    if (this.controller.serverVersion >= C.MIN_SERVER_VER.UNREALIZED_PNL) {
      unrealizedPnL = this.dequeueFloat();
    }
    if (this.controller.serverVersion >= C.MIN_SERVER_VER.REALIZED_PNL) {
      realizedPnL = this.dequeueFloat();
    }

    const value = this.dequeueFloat();

    this.emit(EventName.pnlSingle, reqId, pos, dailyPnL, unrealizedPnL, realizedPnL, value);
  }

  /**
   * Decode a HISTORICAL_TICKS message from data queue and emit a historicalTicks event.
   */
  private decodeMsg_HISTORICAL_TICKS(): void {
    const reqId = this.dequeueInt();
    const tickCount = this.dequeueInt();
    const ticks: HistoricalTick[] = new Array(tickCount);
    for (let i = 0; i < tickCount; i++) {
      ticks[i] = {
        time: this.dequeueInt(),
        price: this.dequeueFloat(),
        size: this.dequeueInt()
      };
    }
    const done = this.dequeueBool();

    this.emit(EventName.historicalTicks, reqId, ticks, done);
  }

  /**
   * Decode a HISTORICAL_TICKS_BID_ASK message from data queue and emit a historicalTicksBidAsk event.
   */
  private decodeMsg_HISTORICAL_TICKS_BID_ASK(): void {
    const reqId = this.dequeueInt();
    const tickCount = this.dequeueInt();
    const ticks: HistoricalTickBidAsk[] = new Array(tickCount);
    for (let i = 0; i < tickCount; i++) {
      const time = this.dequeueInt();
      const flags = this.dequeueInt();
      const priceBid = this.dequeueFloat();
      const priceAsk = this.dequeueFloat();
      const sizeBid = this.dequeueInt();
      const sizeAsk = this.dequeueInt();
      ticks[i] = {
        time: time,
        tickAttribBidAsk: {
          bidPastLow: (flags & (1<<0)) != 0,
          askPastHigh: (flags & (1<<1)) != 0
        },
        priceBid: priceBid,
        priceAsk: priceAsk,
        sizeBid: sizeBid,
        sizeAsk: sizeAsk
      };
    }
    const done = this.dequeueBool();

    this.emit(EventName.historicalTicksBidAsk, reqId, ticks, done);
  }

  /**
   * Decode a HISTORICAL_TICKS_LAST message from data queue and emit a historicalTicksLast event.
   */
  private decodeMsg_HISTORICAL_TICKS_LAST(): void {
    const reqId = this.dequeueInt();
    const tickCount = this.dequeueInt();
    const ticks: HistoricalTickLast[] = new Array(tickCount);
    for (let i = 0; i < tickCount; i++) {
      const time = this.dequeueInt();
      const mask = this.dequeueInt();
      const price = this.dequeueFloat();
      const size = this.dequeueInt();
      const exchange = this.dequeue();
      const specialConditions = this.dequeue();
      ticks[i] = {
        time: time,
        tickAttribBidAsk: {
          pastLimit: (mask & (1 << 0)) !== 0,
          unreported: (mask & (1 << 1)) !== 0
        },
        price: price,
        size: size,
        exchange: exchange,
        specialConditions: specialConditions
      };
    }
    const done = this.dequeueBool();

    this.emit(EventName.historicalTicksLast, reqId, ticks, done);
  }

  /**
   * Decode a TICK_BY_TICK message from data queue and a emit tickByTickAllLast, tickByTickBidAsk or tickByTickMidPoint event.
   */
  private decodeMsg_TICK_BY_TICK() : void{
    const reqId = this.dequeueInt();
    const tickType = this.dequeueInt();
    const time = this.dequeue();

    switch (tickType) {
      case 0: // None
        break;
      case 1: // Last
      case 2: // All-last
      {
        const price = this.dequeueFloat();
        const size = this.dequeueInt();
        const mask = this.dequeueInt();
        const pastLimit = (mask & (1 << 0)) !== 0;
        const unreported = (mask & (1 << 1)) !== 0;
        const exchange = this.dequeue();
        const specialConditions = this.dequeue();

        this.emit(EventName.tickByTickAllLast, reqId, tickType, time, price, size, { pastLimit, unreported }, exchange, specialConditions);
        break;
      }
      case 3: // BidAsk
      {
        const bidPrice = this.dequeueFloat();
        const askPrice = this.dequeueFloat();
        const bidSize = this.dequeueInt();
        const askSize = this.dequeueInt();
        const mask = this.dequeueInt();
        const bidPastLow = (mask & (1 << 0)) !== 0;
        const askPastHigh = (mask & (1 << 1)) !== 0;

        this.emit(EventName.tickByTickBidAsk, reqId, time, bidPrice, askPrice, bidSize, askSize, { bidPastLow, askPastHigh });
        break;
      }
      case 4: // MidPoint
      {
        const midPoint = this.dequeueFloat();

        this.emit(EventName.tickByTickMidPoint, reqId, time, midPoint);
        break;
      }
    }
  }

  /**
   * Decode a [[Contract]] object from data queue.
   */
  private decodeContract(version: number): Contract {
    const contract: Contract = {};

    contract.conId = this.dequeueInt();
    contract.symbol = this.dequeue();
    contract.secType = this.dequeue() as SecType;
    contract.lastTradeDateOrContractMonth = this.dequeue();
    contract.strike = this.dequeueFloat();
    contract.right = this.dequeue() as OptionType;

    if (version >= 32) {
      contract.multiplier = this.dequeueInt();
    }

    contract.exchange = this.dequeue();
    contract.currency = this.dequeue();
    contract.localSymbol = this.dequeue();

    if (version >= 32) {
      contract.tradingClass = this.dequeue();
    }

    return contract;
  }

  /**
   * Decode a [[Order]] object from data queue.
   */
  private decodeOrder(version: number): Order {
    const order: Order = {};

    order.action = this.dequeue();

    if (this.controller.serverVersion >= C.MIN_SERVER_VER.FRACTIONAL_POSITIONS)	{
      order.totalQuantity = this.dequeueFloat();
    } else {
      order.totalQuantity = this.dequeueInt();
    }

    order.orderType = this.dequeue();

    if (version < 29) {
      order.lmtPrice = this.dequeueFloat();
    } else {
      order.lmtPrice = this.dequeueFloat() || Number.MAX_VALUE;
    }

    if (version < 30) {
      order.auxPrice = this.dequeueFloat();
    } else {
      order.auxPrice = this.dequeueFloat() || Number.MAX_VALUE;
    }

    order.tif = this.dequeue();
    order.ocaGroup = this.dequeue();
    order.account = this.dequeue();
    order.openClose = this.dequeue();
    order.origin = this.dequeueInt();
    order.orderRef = this.dequeue();
    order.clientId = this.dequeueInt();
    order.permId = this.dequeueInt();
    order.outsideRth = this.dequeueBool();
    order.hidden = this.dequeueBool();
    order.discretionaryAmt = this.dequeueFloat();
    order.goodAfterTime = this.dequeue();
    this.dequeue(); // skip deprecated sharesAllocation field
    order.faGroup = this.dequeue();
    order.faMethod = this.dequeue();
    order.faPercentage = this.dequeue();
    order.faProfile = this.dequeue();
    order.goodTillDate = this.dequeue();
    order.rule80A = this.dequeue();
    order.percentOffset = this.dequeueFloat() || Number.MAX_VALUE;
    order.settlingFirm = this.dequeue();
    order.shortSaleSlot = this.dequeueInt();
    order.designatedLocation = this.dequeue();

    if (this.controller.serverVersion === C.MIN_SERVER_VER.SSHORTX_OLD) {
      this.dequeueInt();  // exemptCode
    } else if (version >= 23) {
      order.exemptCode = this.dequeueInt();
    }

    order.auctionStrategy = this.dequeueInt();
    order.startingPrice = this.dequeueFloat() || Number.MAX_VALUE;
    order.stockRefPrice = this.dequeueFloat() || Number.MAX_VALUE;
    order.delta = this.dequeueFloat() || Number.MAX_VALUE;
    order.stockRangeLower = this.dequeueFloat() || Number.MAX_VALUE;
    order.stockRangeUpper = this.dequeueFloat() || Number.MAX_VALUE;
    order.displaySize = this.dequeueInt();
    order.blockOrder = this.dequeueBool();
    order.sweepToFill = this.dequeueBool();
    order.allOrNone = this.dequeueBool();
    order.minQty = this.dequeueInt() || Number.MAX_VALUE;
    order.ocaType = this.dequeueInt();
    order.eTradeOnly = this.dequeueBool();
    order.firmQuoteOnly = this.dequeueBool();
    order.nbboPriceCap = this.dequeueFloat() || Number.MAX_VALUE;
    order.parentId = this.dequeueInt();
    order.triggerMethod = this.dequeueInt();
    order.volatility = this.dequeueFloat() || Number.MAX_VALUE;
    order.volatilityType = this.dequeueInt();
    order.deltaNeutralOrderType = this.dequeue();
    order.deltaNeutralAuxPrice = this.dequeueFloat() || Number.MAX_VALUE;

    if (version >= 27 && order?.deltaNeutralOrderType.length) {
      order.deltaNeutralConId = this.dequeueInt();
      order.deltaNeutralSettlingFirm = this.dequeue();
      order.deltaNeutralClearingAccount = this.dequeue();
      order.deltaNeutralClearingIntent = this.dequeue();
    }

    if (version >= 31 && order?.deltaNeutralOrderType.length) {
      order.deltaNeutralOpenClose = this.dequeue();
      order.deltaNeutralShortSale = this.dequeueBool();
      order.deltaNeutralShortSaleSlot = this.dequeueInt();
      order.deltaNeutralDesignatedLocation = this.dequeue();
    }

    order.continuousUpdate = this.dequeueInt();
    order.referencePriceType = this.dequeueInt();
    order.trailStopPrice = this.dequeueFloat() || Number.MAX_VALUE;

    if (version >= 30) {
      order.trailingPercent = this.dequeueFloat() || Number.MAX_VALUE;
    }

    order.basisPoints = this.dequeueFloat() || Number.MAX_VALUE;
    order.basisPointsType = this.dequeueInt() || Number.MAX_VALUE;

    return order;
  }

  /**
   * Decode a [[ComboLeg]] object from data queue.
   */
  private decodeComboLeg(): ComboLeg {
    return {
      conId: this.dequeueInt(),
      ratio: this.dequeueInt(),
      action: this.dequeue(),
      exchange: this.dequeue(),
      openClose: this.dequeueInt(),
      shortSaleSlot: this.dequeueInt(),
      designatedLocation: this.dequeue(),
      exemptCode: this.dequeueInt()
    };
  }

  /**
   * Read last trade date, parse it and assign to proper [[ContractDetails]] attributes.
   */
  private readLastTradeDate(contract: ContractDetails, isBond: boolean): void {
    const lastTradeDateOrContractMonth = this.dequeue();
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
