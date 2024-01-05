/**
 * This file implement test code for the public API interfaces.
 */
import { Contract, EventName, IBApi, Stock, WhatToShow } from "../../..";
import configuration from "../../../common/configuration";

describe("IBApi Historical data Tests", () => {
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

  it("Returns the correct head timestamp", (done) => {
    const referenceID = 42;

    ib.once(EventName.connected, () => {
      const contract: Contract = new Stock("AAPL");

      ib.reqHeadTimestamp(referenceID, contract, WhatToShow.TRADES, true, 2)
        .on(EventName.headTimestamp, (requestId, headTimestamp) => {
          if (requestId === referenceID) {
            expect(headTimestamp).toEqual("345479400");
            ib.disconnect();
          }
        })
        .on(EventName.disconnected, done)
        .on(EventName.error, (err, code, requestId) => {
          if (requestId === referenceID) {
            done(`[${requestId}] ${err.message} (#${code})`);
          }
        });
    });

    ib.connect();
  });
});
