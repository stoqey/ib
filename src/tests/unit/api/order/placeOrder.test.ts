/**
 * This file implement test code for the placeOrder function .
 */
import {
  ConjunctionConnection,
  Contract,
  ErrorCode,
  EventName,
  IBApi,
  Option,
  OptionType,
  Order,
  OrderAction,
  OrderType,
  PriceCondition,
  Stock,
  TimeInForce,
  TriggerMethod,
} from "../../../..";
import configuration from "../../../../common/configuration";
import logger from "../../../../common/logger";

describe("Place Orders", () => {
  jest.setTimeout(20 * 1000);

  let ib: IBApi;
  let clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  beforeEach(() => {
    ib = new IBApi({
      host: configuration.ib_host,
      port: configuration.ib_port,
      clientId: clientId++, // increment clientId for each test so they don't interfere on each other
    });
    // logger.info("IBApi created");
  });

  afterEach(() => {
    if (ib) {
      ib.disconnect();
      ib = undefined;
    }
    // logger.info("IBApi disconnected");
  });

  test("Simple placeOrder", (done) => {
    let refId: number;

    const refContract: Contract = new Stock("SPY");
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 1,
      orderId: refId,
      totalQuantity: 2,
      // account: "DU123567",
      tif: TimeInForce.DAY,
      transmit: true,
    };

    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, orderState) => {
        if (orderId == refId) {
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          done();
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("placeOrder with PriceCondition", (done) => {
    let refId: number;

    // buy an Apple call, with a PriceCondition on underlying
    const refContract: Contract = new Option(
      "AAPL",
      "20251219",
      200,
      OptionType.Call,
    );
    const priceCondition: PriceCondition = new PriceCondition(
      29,
      TriggerMethod.Default,
      265598,
      "SMART",
      true,
      ConjunctionConnection.OR,
    );
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 0.01,
      totalQuantity: 1,
      // account: "DU123567",
      conditionsIgnoreRth: true,
      conditionsCancelOrder: false,
      conditions: [priceCondition],
      transmit: true,
    };

    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, orderState) => {
        if (orderId == refId) {
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          done();
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("What if Order", (done) => {
    let refId: number;

    const refContract: Contract = new Stock("SPY");
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 1,
      orderId: refId,
      totalQuantity: 2,
      tif: TimeInForce.DAY,
      transmit: true,
      whatIf: true,
    };

    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, orderState) => {
        if (orderId == refId) {
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
          if (orderState.minCommission || orderState.maxCommission) {
            expect(orderState.commissionCurrency).toEqual(refContract.currency);
            done();
          }
        }
      })
      .on(
        EventName.error,
        (
          error: Error,
          code: ErrorCode,
          reqId: number,
          _advancedOrderReject?: unknown,
        ) => {
          if (reqId === -1) {
            logger.info(error.message);
          } else {
            const msg = `[${reqId}] ${error.message} (Error #${code})`;
            if (
              error.message.includes("Warning:") ||
              error.message.includes("Order Message:")
            ) {
              logger.warn(msg);
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });
});
