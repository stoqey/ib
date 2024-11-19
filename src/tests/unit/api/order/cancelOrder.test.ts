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
  OrderStatus,
  OrderType,
  TimeInForce,
} from "../../../..";
import configuration from "../../../../common/configuration";
import logger from "../../../../common/logger";
import { sample_etf } from "../../sample-data/contracts";

describe("CancelOrder", () => {
  jest.setTimeout(20 * 1000);

  let ib: IBApi;
  let clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  const contract: Contract = sample_etf;
  const order: Order = {
    orderType: OrderType.LMT,
    action: OrderAction.BUY,
    lmtPrice: 3,
    totalQuantity: 1,
    tif: TimeInForce.DAY,
    outsideRth: true,
    transmit: true,
    goodAfterTime: "20300101-01:01:01",
  };

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

  test("cancelOrder", (done) => {
    let refId: number;

    let isCancelling = false;
    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, contract, order);
    })
      .on(
        EventName.orderStatus,
        (
          orderId,
          status,
          _filled,
          _remaining,
          _avgFillPrice,
          _permId,
          _parentId,
          _lastFillPrice,
          _clientId,
          _whyHeld,
          _mktCapPrice,
        ) => {
          if (orderId === refId) {
            // console.log(orderId, status);
            if (isDone) {
              // ignore any message
            } else if (!isCancelling) {
              // [OrderStatus.PreSubmitted, OrderStatus.Submitted].includes(
              //   status as OrderStatus,
              // )
              isCancelling = true;
              ib.cancelOrder(orderId);
            } else {
              if (
                [
                  OrderStatus.PendingCancel,
                  OrderStatus.ApiCancelled,
                  OrderStatus.Cancelled,
                ].includes(status as OrderStatus)
              ) {
                isDone = true;
                done();
              }
            }
          }
        },
      )
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
            } else if (
              code == ErrorCode.ORDER_CANCELLED &&
              reqId == refId &&
              isCancelling
            ) {
              // isDone = true;
              logger.info(msg);
              // done();
            } else {
              isDone = true;
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("cancelOrder immediate", (done) => {
    let refId: number;

    let isCancelling = false;
    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, contract, order);
    })
      .on(EventName.orderStatus, (orderId) => {
        if (orderId === refId) {
          if (isDone) {
            // ignore any message
          } else if (!isCancelling) {
            isCancelling = true;
            ib.cancelOrder(orderId, "");
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
            if (error.message.includes("Warning:")) {
              logger.warn(msg);
            } else if (
              code == ErrorCode.ORDER_CANCELLED &&
              reqId == refId &&
              isCancelling
            ) {
              isDone = true;
              logger.info(msg);
              done();
            } else {
              isDone = true;
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });

  test("cancelOrder later", (done) => {
    // NOTE: this test is not correctly written, but the API doesn't behave as expected neither
    let refId: number;

    let isCancelling = false;
    let isDone = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, contract, { ...order, goodAfterTime: undefined });
    })
      .on(EventName.orderStatus, (orderId, status) => {
        if (orderId === refId) {
          if (isDone) {
            // ignore any message
          } else if (!isCancelling) {
            isCancelling = true;
            ib.cancelOrder(orderId, "20260101-23:59:59");
          } else {
            if (
              [
                OrderStatus.PendingCancel,
                OrderStatus.ApiCancelled,
                OrderStatus.Cancelled,
              ].includes(status as OrderStatus)
            ) {
              isDone = true;
              done();
            }
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
            if (error.message.includes("Warning:")) {
              logger.warn(msg);
            } else if (
              code == ErrorCode.ORDER_CANCELLED &&
              reqId == refId &&
              isCancelling
            ) {
              logger.info(msg);
            } else {
              isDone = true;
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });
});
