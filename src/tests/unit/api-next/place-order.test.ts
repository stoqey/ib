import IBApi, {
  ConjunctionConnection,
  Contract,
  ErrorCode,
  EventName,
  IBApiNext,
  OptionType,
  Order,
  OrderAction,
  OrderState,
  OrderType,
  PriceCondition,
  SecType,
  TriggerMethod,
} from "../../..";
// import configuration from "../../../common/configuration";

describe("Place orders to IB", () => {
  // jest.setTimeout(30000);
  test("Error Event", async (done) => {
    // console.log("started test");
    const apiNext = new IBApiNext();
    apiNext.connect();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;
    api
      .on(EventName.error, (error: Error, _code: ErrorCode, _reqId: number) => {
        console.log("error message : " + error.message);
        fail(error.message);
      })
      .on(
        EventName.openOrder,
        (
          openOrderId,
          _contract: Contract,
          _order: Order,
          _orderState: OrderState
        ) => {
          console.log("In open Order callback");
          console.log("Open Order : " + openOrderId);
          if (orderId === openOrderId) {
            // done
            console.log(orderId + " : " + openOrderId);
            api.disconnect();
            done();
          }
        }
      )
      .on(
        EventName.orderStatus,
        (openOrderId: number, _status: string, _filled: number, ..._arg) => {
          // console.log("In open Order status callback");
          console.log(
            "order id " +
              openOrderId +
              " Status : " +
              _status +
              " Filled : " +
              _filled
          );
          if (orderId === openOrderId) {
            console.log(orderId + " : " + openOrderId);
            // api.disconnect();
            // done();
          }
          // console.log("Order status : " + openOrderId);
        }
      )
      .on(EventName.openOrderEnd, () => {
        console.log("Open order end");
        done();
      })
      .on(
        EventName.orderBound,
        (orderId: number, apiClientId: number, apiOrderId: number) => {
          console.log(
            "order id " +
              orderId +
              " apiClientId : " +
              apiClientId +
              " apiOrderId : " +
              apiOrderId
          );
        }
      );
    const orderId = await apiNext.getNextValidOrderId();
    console.log("Order Id : " + orderId);
    const contract: Contract = {
      symbol: "AAPL",
      exchange: "CBOE",
      currency: "USD",
      secType: SecType.OPT,
      right: OptionType.Call,
      strike: 130,
      multiplier: 100,
      lastTradeDateOrContractMonth: "20230616",
    };

    // const priceCondition: PriceCondition = new PriceCondition(
    //   29,
    //   TriggerMethod.Default,
    //   3691937, // APPLE Stock on SMART
    //   "SMART",
    //   true,
    //   ConjunctionConnection.OR
    // );

    const order: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 1,
      orderId,
      totalQuantity: 1,
      account: "DU123456",
      conditionsIgnoreRth: true,
      conditionsCancelOrder: false,
      // conditions: [priceCondition],
    };

    apiNext.placeOrder(orderId, contract, order);

    api.reqOpenOrders();
    // jest.setTimeout(30000);
    // const openOrders = await apiNext.getAllOpenOrders();
    // openOrders.forEach((openOrder) => {
    //   if (openOrder.orderId === orderId) {
    //     apiNext.disconnect();
    //     done();
    //   }
    // });
    // console.log("open orders" + JSON.stringify(openOrders, null, 2));
    // apiNext.disconnect();
    // done();
  });
});
