/**
 * This file implement test code for the placeOrder function .
 */
import {
  ConjunctionConnection,
  Contract,
  ErrorCode,
  EventName,
  IBApi,
  OptionType,
  OrderAction,
  OrderType,
  PriceCondition,
  SecType,
  TriggerMethod,
} from "../../../..";
// import OptionType from "../../../../api/data/enum/option-type";
import configuration from "../../../../common/configuration";
import logger from "../../../../common/logger";

const TEST_SERVER_HOST = configuration.ib_host;
const TEST_SERVER_PORT = configuration.ib_port;
// const TEST_SERVER_PORT = 4002; // use paper account

const awaitTimeout = (delay: number): Promise<unknown> =>
  new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, delay * 1000));

describe("PlaceOrder", () => {
  jest.setTimeout(20000);
  let _clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  test("Simple placeOrder", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_PORT,
    });

    ib.on(EventName.error, (error: Error, code: ErrorCode, reqId: number, _advancedOrderReject?: unknown) => {
      if (reqId === -1) {
        logger.info(error.message);
      } else {
        ib.disconnect();
        logger.error(error.message, _advancedOrderReject);
        done(`${error.message} (Error #${code})`);
      }
    }).once(EventName.nextValidId, (orderId: number) => {
      // buy an Apple call, with a PriceCondition on underlying

      const contract: Contract = {
        symbol: "AAPL",
        exchange: "SMART",
        currency: "USD",
        secType: SecType.STK,
      };

      ib.placeOrder(orderId, contract, {
        orderType: OrderType.LMT,
        action: OrderAction.BUY,
        lmtPrice: 1,
        orderId,
        totalQuantity: 1,
        // account: "DU123567",
        tif: "DAY",
        transmit: true,
      });

      // verify result
      let received = false;

      ib.on(EventName.openOrder, (id, _contract, _order, _orderState) => {
        if (id === orderId) {
          received = true;
        }
      }).on(EventName.openOrderEnd, () => {
        ib.disconnect();
        if (received) done();
        else done(`Order ${orderId} not placed`);
      });

      // Give a few secs delay to get order placed
      awaitTimeout(2).then(() => ib.reqOpenOrders());
    });

    ib.connect(_clientId++);
    ib.reqIds();
  });

  test("placeOrder with PriceCondition", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_PORT,
    });

    ib.on(EventName.error, (error: Error, code: ErrorCode, reqId: number, _advancedOrderReject?: unknown) => {
      if (reqId === -1) {
        logger.info(error.message);
      } else {
        ib.disconnect();
        logger.error(error.message, _advancedOrderReject);
        done(`${error.message} (Error #${code})`);
      }
    }).once(EventName.nextValidId, (orderId: number) => {
      // buy an Apple call, with a PriceCondition on underlying

      const contract: Contract = {
        symbol: "AAPL",
        exchange: "SMART",
        currency: "USD",
        secType: SecType.OPT,
        right: OptionType.Call,
        strike: 200,
        multiplier: 100,
        lastTradeDateOrContractMonth: "20251219",
      };

      const priceCondition: PriceCondition = new PriceCondition(
        29,
        TriggerMethod.Default,
        3691937, // AMZN Stock on SMART
        "SMART",
        true,
        ConjunctionConnection.OR,
      );

      ib.placeOrder(orderId, contract, {
        orderType: OrderType.LMT,
        action: OrderAction.BUY,
        lmtPrice: 0.01,
        orderId,
        totalQuantity: 1,
        // account: "DU123567",
        conditionsIgnoreRth: true,
        conditionsCancelOrder: false,
        conditions: [priceCondition],
        transmit: true,
      });

      // verify result
      let received = false;

      ib.on(EventName.openOrder, (id, _contract, _order, _orderState) => {
        if (id === orderId) {
          received = true;
        }
      }).on(EventName.openOrderEnd, () => {
        ib.disconnect();
        if (received) done();
        else done(`Order ${orderId} not placed`);
      });

      // Give a few secs delay to get order placed
      awaitTimeout(2).then(() => ib.reqOpenOrders());
    });

    ib.connect(_clientId++);
    ib.reqIds();
  });
});
