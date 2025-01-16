/**
 * This file implement test code for the public API interfaces.
 */
import {
  EventName,
  IBApi,
  isNonFatalError
} from "../../..";
import configuration from "../../../common/configuration";
import logger from "../../../common/logger";

describe("IBApi Historical news Tests", () => {
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
      ib = undefined;
    }
  });

  it("Get news providers", (done) => {
    ib.once(EventName.connected, () => {
      ib.reqNewsProviders
    })
      .on(EventName.newsProviders,
        (newsProviders) => {
          expect(newsProviders).toBeDefined();
          expect(newsProviders).toBeInstanceOf(Array);

          const firstProvider = newsProviders[0];
          expect(firstProvider).toBeDefined();
          expect(firstProvider.providerCode).toBeDefined();
          expect(firstProvider.providerName).toBeDefined();
          done();
        },
      )
    ib.on(EventName.info, (msg, code) => logger.info(code, msg))
      .on(EventName.error, (error, code, reqId) => {
        const msg = `[${reqId}] ${error.message} (Error #${code})`;
        isNonFatalError(code, error) ? logger.warn(msg) : done(msg);
      })
      .connect()
      .reqNewsProviders();
  });

  it("Get PLTR news data with BRFG", (done) => {
    const refId = 46;
    const contractId = 444857009; // PLTR
    const providerCode = "BRFG";

    let received = false;

    ib.once(EventName.connected, () => {
      ib.reqHistoricalNews(
        refId,
        contractId,
        providerCode,
        "2025-01-13 00:00:00",
        "2025-01-14 00:00:00",
        10,
        null
      );
    })
      .on(EventName.historicalNews,
        (reqId, time, providerCode, articleId, headline) => {
          expect(reqId).toEqual(refId);
          if (reqId == refId) received = true;
          expect(time).toBeDefined();
          expect(providerCode).toBeDefined();
          expect(articleId).toBeDefined();
          expect(headline).toBeDefined();
        },
      )
      .on(EventName.historicalNewsEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      })

    ib.on(EventName.info, (msg, code) => logger.info(code, msg))
      .on(EventName.error, (error, code, reqId) => {
        const msg = `[${reqId}] ${error.message} (Error #${code})`;
        isNonFatalError(code, error) ? logger.warn(msg) : done(msg);
      })
      .connect();
  });

});
