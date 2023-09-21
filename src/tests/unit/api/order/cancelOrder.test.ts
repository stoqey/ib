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

describe("CancelOrder", () => {
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

  test("cancelOrder", (done) => {
    let refId: number;

    const contract: Contract = {
      symbol: "AAPL",
      exchange: "SMART",
      currency: "USD",
      secType: SecType.STK,
    };
    const order: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 1,
      totalQuantity: 1,
      // account: "DU123567",
      tif: "GTC",
      transmit: true,
    };

    let order_found = false;
    ib.once(EventName.nextValidId, (orderId: number) => {
      refId = orderId;
      ib.placeOrder(refId, contract, order);
    })
      .on(EventName.openOrder, (orderId, _contract, _order, _orderState) => {
        expect(orderId).toEqual(refId);
        if (!order_found && orderId === refId) {
          order_found = true;
          ib.cancelOrder(refId);
        }
      })
      .on(
        EventName.orderStatus,
        (
          orderId,
          _status,
          _filled,
          _remaining,
          _avgFillPrice,
          _permId?,
          _parentId?,
          _lastFillPrice?,
          _clientId?,
          _whyHeld?,
          _mktCapPrice?,
        ) => {
          expect(orderId).toEqual(refId);
        },
      )
      .on(EventName.openOrderEnd, () => {})
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
              order_found
            ) {
              done();
            } else {
              done(msg);
            }
          }
        },
      );

    ib.connect().reqOpenOrders();
  });
});
