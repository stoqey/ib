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
    // logger.info("IBApi created");
  });

  afterEach(() => {
    if (ib) {
      ib.disconnect();
      ib = undefined;
    }
    // logger.info("IBApi disconnected");
  });

  it("Test reqCompletedOrders", (done) => {
    ib.on(EventName.completedOrder, (contract, order, orderState) => {
      expect(orderState.status).toBeTruthy();
    })
      .on(EventName.completedOrdersEnd, () => {
        if (ib) ib.disconnect();
      })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqCompletedOrders(false);
  });
});
