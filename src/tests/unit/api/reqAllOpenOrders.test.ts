/**
 * This file implement test code for the reqAllOpenOrders function and openOrder event.
 */
import { IBApi, EventName, Contract, ErrorCode, Order, OrderState } from "../../..";
import configuration from "../../../configuration/configuration";
import logger from "../../../utils/logger";

const TEST_SERVER_HOST = configuration.ib_test_host;
const TEST_SERVER_POST = configuration.ib_test_port;

describe("IBApi Tests", () => {

  it("Test reqAllOpenOrders", (done) => {

    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST,
    });

    ib.on(EventName.openOrder, (orderId: number, contract: Contract, order: Order, orderState: OrderState) => {

      // todo add proper verification code here
      expect(contract.symbol === "GOOGL").toBeTruthy();

      ib.disconnect();
    })
    .on(EventName.connected, () => {
      ib.reqAllOpenOrders();
    })
    .on(EventName.disconnected, () => {
      done();
    })
    .on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
      expect(`${err.message} - code: ${code} - id: ${id}`).toBeTruthy();
    });

    ib.connect();
  });
});
