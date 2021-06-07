/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * This file implement test code for the reqAllOpenOrders function and openOrder event.
 */
import { ErrorCode, EventName, IBApi } from "../../../..";
import configuration from "../../../../common/configuration";
import logger from "../../../../common/logger";

const TEST_SERVER_HOST = configuration.ib_host;
const TEST_SERVER_POST = configuration.ib_port;

describe("RequestAllOpenOrders", () => {
  jest.setTimeout(20000);
  it("Test reqAllOpenOrders", (done) => {
    logger.info(
      `Using host: ${TEST_SERVER_HOST} and port: ${TEST_SERVER_POST} for test `
    );
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
      .on(EventName.orderStatus, (orderId) => {
        // todo add proper verification code here

        expect(typeof orderId).toEqual("number");
        orderStatusReceived = true;
        if (openOrderReceived && orderStatusReceived) {
          // done
          ib.disconnect();
        }
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
