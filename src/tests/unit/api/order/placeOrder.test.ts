/**
 * This file implement test code for the placeOrder function .
 */
import {
    ConjunctionConnection, Contract, ErrorCode, EventName, IBApi, OrderAction, OrderType,
    PriceCondition, SecType, TriggerMethod
} from "../../../..";
import OptionType from "../../../../api/data/enum/option-type";

describe("RequestAllOpenOrders", () => {
  jest.setTimeout(20000);

  test("placeOrder with PriceCondition", (done) => {
    const ib = new IBApi({
      port: 4002, // use Gateway
    });

    ib.on(EventName.error, (error: Error, code: ErrorCode, reqId: number) => {
      fail(error.message);
    }).once(EventName.nextValidId, (orderId: number) => {
      // buy an Apple call, with a PriceCondition on underlying

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

      const priceCondition: PriceCondition = new PriceCondition(
        29,
        TriggerMethod.Default,
        3691937, // APPLE Stock on SMART
        "SMART",
        true,
        ConjunctionConnection.OR
      );

      ib.placeOrder(orderId, contract, {
        orderType: OrderType.LMT,
        action: OrderAction.BUY,
        lmtPrice: 1,
        orderId,
        totalQuantity: 1,
        account: "DU123567",
        conditionsIgnoreRth: true,
        conditionsCancelOrder: false,
        conditions: [priceCondition],
      });

      // verify result
      let finished = false;

      ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
        if (orderId === orderId) {
          // done
          ib.disconnect();
          finished = true;
          done();
        }
      }).on(EventName.openOrderEnd, () => {
        if (!finished) {
          fail();
        }
      });

      ib.reqAllOpenOrders();
    });

    ib.connect();
    ib.reqIds();
  });
});
