/**
 * This file implement test code for the reqAllOpenOrders function and openOrder event.
 */
import { IBApi, EventName, ErrorCode } from "../../..";
import configuration from "../../../configuration/configuration";

const TEST_SERVER_HOST = configuration.ib_test_host;
const TEST_SERVER_POST = configuration.ib_test_port;

describe("RequestAllOpenOrders", () => {
  jest.setTimeout(20000);
  it("Test reqAllOpenOrders", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST,
    });

    let openOrderReceived = false;
    let orderStatusReceived = false;

    ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
      // todo add proper verification code here
      expect(contract.symbol === "GOOGL").toBeTruthy();

      openOrderReceived = true;
      if (openOrderReceived && orderStatusReceived) {
        // done
        ib.disconnect();
      }
    })
      .on(
        EventName.orderStatus,
        (orderId, apiClientId, apiOrderId, whyHeld, mktCapPrice) => {
          // todo add proper verification code here

          expect(typeof orderId).toEqual("number");
          orderStatusReceived = true;
          if (openOrderReceived && orderStatusReceived) {
            // done
            ib.disconnect();
          }
        }
      )
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
