/**
 * This file implement test code for the placeOrder function .
 */
import { Contract, ErrorCode, EventName, IBApi, Order } from "../../../..";
import configuration from "../../../../common/configuration";
import logger from "../../../../common/logger";
import {
  sample_crypto,
  sample_etf,
  sample_option,
  sample_stock,
} from "../../sample-data/contracts";
import { sample_order } from "../../sample-data/orders";

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
  });

  afterEach(() => {
    if (ib) {
      ib.disconnect();
      ib = undefined;
    }
  });

  test("Stock placeOrder", (done) => {
    let refId: number;

    const refContract: Contract = sample_stock;
    const refOrder: Order = sample_order;

    let isSuccess = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.reqOpenOrders().placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId) {
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
        }
      })
      .on(EventName.orderStatus, (orderId, _status, filled, remaining) => {
        if (!isSuccess && orderId == refId) {
          expect(filled).toEqual(0);
          expect(remaining).toEqual(refOrder.totalQuantity);
          isSuccess = true;
          ib.cancelOrder(orderId);
          done();
        }
      });

    ib.connect().on(EventName.error, (error, code, reqId) => {
      if (reqId === ErrorCode.NO_VALID_ID) {
        done(error.message);
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
    });
  });

  test("What if Order", (done) => {
    let refId: number;

    const refContract: Contract = sample_etf;
    // const refOrder: Order = {
    //   orderType: OrderType.LMT,
    //   action: OrderAction.BUY,
    //   lmtPrice: 1,
    //   orderId: refId,
    //   totalQuantity: 2,
    //   tif: TimeInForce.DAY,
    //   transmit: true,
    //   whatIf: true,
    // };
    const refOrder: Order = {
      ...sample_order,
      goodAfterTime: undefined,
      whatIf: true,
    };

    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.reqOpenOrders().placeOrder(refId, refContract, refOrder);
    }).on(EventName.openOrder, (orderId, contract, order, orderState) => {
      if (orderId == refId) {
        expect(contract.symbol).toEqual(refContract.symbol);
        expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
        if (orderState.minCommission || orderState.maxCommission) {
          expect(orderState.commissionCurrency).toEqual(refContract.currency);
          done();
        }
      }
    });

    ib.connect().on(EventName.error, (error, code, reqId) => {
      if (reqId === ErrorCode.NO_VALID_ID) {
        done(error.message);
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
    });
  });

  test("Crypto placeOrder", (done) => {
    let refId: number;

    const refContract: Contract = sample_crypto;
    const refOrder: Order = sample_order;

    let isSuccess = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.reqOpenOrders().placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId) {
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
        }
      })
      .on(EventName.orderStatus, (orderId, _status, filled, remaining) => {
        if (!isSuccess && orderId == refId) {
          expect(filled).toEqual(0);
          expect(remaining).toEqual(refOrder.totalQuantity);
          isSuccess = true;
          ib.cancelOrder(orderId);
          done();
        }
      });

    ib.connect().on(EventName.error, (error, code, reqId) => {
      if (reqId === ErrorCode.NO_VALID_ID) {
        done(error.message);
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
    });
  });

  test("Option placeOrder", (done) => {
    let refId: number;

    const refContract: Contract = sample_option;
    const refOrder: Order = sample_order;

    let isSuccess = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.reqOpenOrders().placeOrder(refId, refContract, refOrder);
    })
      .on(EventName.openOrder, (orderId, contract, order, _orderState) => {
        if (orderId == refId) {
          expect(contract.symbol).toEqual(refContract.symbol);
          expect(order.totalQuantity).toEqual(refOrder.totalQuantity);
        }
      })
      .on(EventName.orderStatus, (orderId, _status, filled, remaining) => {
        if (!isSuccess && orderId == refId) {
          expect(filled).toEqual(0);
          expect(remaining).toEqual(refOrder.totalQuantity);
          isSuccess = true;
          ib.cancelOrder(orderId);
          done();
        }
      });

    ib.connect().on(EventName.error, (error, code, reqId) => {
      if (reqId === ErrorCode.NO_VALID_ID) {
        done(error.message);
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
    });
  });
});
