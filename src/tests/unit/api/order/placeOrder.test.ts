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

    const contract: Contract = new Stock("SPY");
    const order: Order = {
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
      ib.placeOrder(refId, contract, order);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        expect(orderId).toEqual(refId);
        expect(contract.symbol).toEqual("AAPL");
        expect(order.totalQuantity).toEqual(2);
      })
      .on(EventName.openOrderEnd, () => {
        done();
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
            if (error.message.includes("Warning:")) {
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
    const contract: Contract = new Option(
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
    const order: Order = {
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
      ib.placeOrder(refId, contract, order);
    })
      .on(EventName.openOrder, (orderId, _contract, _order, _orderState) => {
        expect(orderId).toEqual(refId);
      })
      .on(EventName.openOrderEnd, () => {
        done();
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
            if (error.message.includes("Warning:")) {
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
