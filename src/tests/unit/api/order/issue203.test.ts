/**
 * This file implement test code for the placeOrder function .
 */
import {
  Contract,
  ErrorCode,
  EventName,
  IBApi,
  Order,
  OrderAction,
  OrderType,
  SecType,
} from "../../../..";
import configuration from "../../../../common/configuration";
import logger from "../../../../common/logger";
import { sample_future } from "../../sample-data/contracts";

describe("Issue #203", () => {
  jest.setTimeout(20 * 1000);

  let ib: IBApi;
  let clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  beforeEach(() => {
    ib = new IBApi({
      host: configuration.ib_host,
      port: configuration.ib_port,
      clientId: clientId++, // increment clientId for each test so they don't interfere on each other
    });
  });

  afterEach(() => {
    if (ib) {
      ib.disconnect();
      ib = undefined;
    }
  });

  test("mafianekcek", (done) => {
    let refId: number;

    const refContract: Contract = sample_future;
    // const refContract: Contract = sample_stock;
    const refOrder: Order = {
      action: OrderAction.BUY,
      lmtPrice: 1,
      totalQuantity: 1,
      transmit: true,
      orderType: OrderType.LMT,
      account: "DU5784856",
      tif: "DAY",
      orderRef: "RS/3/9",
    };

    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId && !isDone) {
          isDone = true;
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
            } else if (code == ErrorCode.NO_TRADING_PERMISSIONS) {
              // Ignore this error for tests
              logger.warn(msg);
              done();
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("fanazhe", (done) => {
    let refId: number;

    const orderId = 2;
    const refContract: Contract = {
      symbol: "ES",
      exchange: "CME",
      currency: "USD",
      lastTradeDateOrContractMonth: "20250620",
      secType: SecType.FUT,
    };
    const refOrder: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 5400,
      orderId,
      totalQuantity: 1,
      transmit: true,
    };

    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      console.log(orderId);
      refId = orderId;
      ib.placeOrder(refId, refContract, refOrder).reqOpenOrders();
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        console.log(orderId, contract, order, _orderState);
        if (orderId == refId && !isDone) {
          isDone = true;
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
            } else if (code == ErrorCode.NO_TRADING_PERMISSIONS) {
              // Ignore this error for tests
              logger.warn(msg);
              done();
            } else {
              ib.disconnect();
              done(msg);
            }
          }
        },
      );

    ib.connect();
  });
});
