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

  let ib: IBApi;
  let clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

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

  it("Test reqAllOpenOrders", (done) => {
    let received = false;

    ib.on(EventName.openOrder, (orderId, contract, order, orderState) => {
      // logger.info("openOrder message received");
      // todo add proper verification code here
      // expect(orderId).toBeTruthy(); We sometimes get zeros
    })
      .on(EventName.openOrderEnd, () => {
        ib.disconnect();
        done();
      })
      .on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
        done(`${err.message} - code: ${code} - id: ${id}`);
      })
      .once(EventName.nextValidId, (orderId: number) => {
        ib.reqAllOpenOrders();
      });

    ib.connect();
  });
});
