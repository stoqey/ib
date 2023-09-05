/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * This file implement test code for the reqAllOpenOrders function and openOrder event.
 */
import { ErrorCode, EventName, IBApi } from "../../../..";
import configuration from "../../../../common/configuration";

const TEST_SERVER_HOST = configuration.ib_host;
const TEST_SERVER_POST = configuration.ib_port;

describe("RequestAllOpenOrders", () => {
  jest.setTimeout(10000);
  let _clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  it("Test reqAllOpenOrders", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST,
    });

    let received = false;

    ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
      // logger.info("openOrder message received");
      // todo add proper verification code here
      // expect(orderId).toBeTruthy(); We sometimes get zeros
    })
      .on(EventName.openOrderEnd, () => {
        // logger.info("openOrderEnd message received");
        received = true;
        // done
        ib.disconnect();
      })
      .on(EventName.connected, () => {
        // logger.info("connected");
        ib.reqIds();
      })
      .on(EventName.disconnected, () => {
        if (received) done();
        else done("We didn't received acknowledge");
      })
      .on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
        done(`${err.message} - code: ${code} - id: ${id}`);
      })
      .once(EventName.nextValidId, (orderId: number) => {
        // logger.info(`nextValidId: ${orderId}, requesting orders`);

        ib.reqAllOpenOrders();
      });

    ib.connect(_clientId++);
  });
});
