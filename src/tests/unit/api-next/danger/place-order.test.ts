import IBApi, { IBApiNext, OrderAction, OrderType } from "../../../..";
import { Contract } from "../../../../api/contract/contract";
import SecType from "../../../../api/data/enum/sec-type";
import { Order } from "../../../../api/order/order";
import configuration from "../../../../common/configuration";

describe('Place orders to IB', () => {
  test("Error Event", async (done) => {
    const apiNext = new IBApiNext({host: configuration.ib_host, port: configuration.ib_port});
    const api = ((apiNext as unknown) as Record<string, unknown>).api as IBApi;

    const contract: Contract = { currency: "USD", symbol: "CARS", secType: SecType.STK }
    const orderId = await apiNext.getNextValidOrderId();

    const order: Order = {
      orderType: OrderType.LMT,
        action: OrderAction.BUY,
        lmtPrice: 1,
        orderId,
        totalQuantity: 1,
        account: configuration.ib_test_account,
        conditionsIgnoreRth: true,
    }

    apiNext
      .placeOrder(orderId, contract, order)


  });
});
