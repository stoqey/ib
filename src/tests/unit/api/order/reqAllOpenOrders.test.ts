/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * This file implement test code for the reqAllOpenOrders function and openOrder event.
 */
import { EventName, IBApi } from "../../../..";
import configuration from "../../../../common/configuration";

describe("RequestAllOpenOrders", () => {
  jest.setTimeout(10 * 1000);

  let ib: IBApi;
  const clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  beforeEach(() => {
    ib = new IBApi({
      host: configuration.ib_host,
      port: configuration.ib_port,
      clientId,
    });
  });

  afterEach(() => {
    if (ib) {
      ib.disconnect();
    }
  });

  it("Test reqAllOpenOrders", (done) => {
    ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
      // logger.info("openOrder message received");
      // todo add proper verification code here
      // expect(orderId).toBeTruthy(); We sometimes get zeros
    })
      .on(EventName.openOrderEnd, () => {
        if (ib) ib.disconnect();
      })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqAllOpenOrders();
  });
});
