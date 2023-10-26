import IBApi, {
  Contract,
  ErrorCode,
  EventName,
  IBApiNext,
  Order,
  OrderAction,
  OrderState,
  OrderStatus,
  OrderType,
  Stock,
} from "../../..";
import configuration from "../../../common/configuration";
// import configuration from "../../../common/configuration";

describe("Place orders to IB", () => {
  test("Error Event", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;
    api
      .on(EventName.error, (error: Error, _code: ErrorCode, _reqId: number) => {
        fail(error.message);
      })
      .on(
        EventName.openOrder,
        (
          openOrderId,
          _contract: Contract,
          _order: Order,
          _orderState: OrderState,
        ) => {
          expect(openOrderId).toEqual(orderId);
          // done();
        },
      )
      .on(
        EventName.orderStatus,
        (openOrderId: number, status: string, filled: number, ..._arg) => {
          expect(openOrderId).toEqual(orderId);
          expect(status).toEqual(OrderStatus.Submitted);
          expect(filled).toBeFalsy();
          // done();
        },
      )
      .on(EventName.openOrderEnd, () => {
        done();
      });
    const orderId = 1;
    const contract: Contract = new Stock("SPY");
    const order: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 120,
      orderId,
      totalQuantity: 10,
      account: configuration.ib_test_account,
    };

    apiNext.placeOrder(orderId, contract, order);
    api.emit(EventName.openOrder, orderId, order, contract);
    api.emit(EventName.orderStatus, orderId, OrderStatus.Submitted, 0);
    api.emit(EventName.openOrderEnd);
  });
});
