/**
 * This file implement test code for the public API interfaces.
 */
import { Contract, DurationUnit, EventName, IBApi, Stock } from "../../..";
import configuration from "../../../common/configuration";

describe("IBApi Histogram data Tests", () => {
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

  it("Histogram market data", (done) => {
    const referenceID = 46;

    ib.once(EventName.connected, () => {
      const contract: Contract = new Stock("AAPL");

      ib.reqHistogramData(referenceID, contract, true, 1, DurationUnit.WEEK)
        .on(EventName.histogramData, (requestID, data) => {
          if (requestID === referenceID) {
            expect(requestID).toEqual(referenceID);
            expect(data.length).toBeGreaterThan(0);
            ib.disconnect();
          }
        })
        .on(EventName.disconnected, done)
        .on(EventName.error, (err, code, requestID) => {
          if (requestID == referenceID) {
            done(`[${requestID}] ${err.message} (#${code})`);
          }
        });
    });

    ib.connect();
  });
});
