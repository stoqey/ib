/**
 * This file implements tests for the [[IBApiNext.getContractDetails]] function.
 */

import { Subscription } from "rxjs";
import { IBApiNext } from "../../..";
import logger from "../../../common/logger";
import { sample_etf } from "../sample-data/contracts";

describe("ApiNext: getContractDetails()", () => {
  jest.setTimeout(10 * 1000);

  const clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  let api: IBApiNext;
  let error$: Subscription;

  beforeEach(() => {
    api = new IBApiNext();

    if (!error$) {
      error$ = api.errorSubject.subscribe((error) => {
        if (error.reqId === -1) {
          logger.warn(`${error.error.message} (Error #${error.code})`);
        } else {
          logger.error(
            `${error.error.message} (Error #${error.code}) ${
              error.advancedOrderReject ? error.advancedOrderReject : ""
            }`,
          );
        }
      });
    }

    try {
      api.connect(clientId);
    } catch (error) {
      logger.error(error.message);
    }
  });

  afterEach(() => {
    if (api) {
      api.disconnect();
      api = undefined;
    }
  });

  test("ETF historical ticks last", (done) => {
    api
      .getHistoricalTicksLast(sample_etf, "20240508-17:00:00", null, 1, true)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (ticks) => {
          //   console.log(ticks.length, ticks);
          expect(ticks.length).toEqual(17);
          expect(ticks[0].time).toEqual(1715187600);
          expect(ticks[0].price).toEqual(516.635);
          expect(ticks[0].size).toEqual(1);
          expect(ticks[0].exchange).toEqual("FINRA");
        },
        complete: () => {
          done();
        },
        error: () => {
          done("Some error occured!");
        },
      });
  });

  test("ETF historical bid/ask ticks", (done) => {
    api
      .getHistoricalTicksBidAsk(
        sample_etf,
        "20240508-17:00:00",
        null,
        1,
        true,
        true,
      )
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (ticks) => {
          //   console.log(ticks.length, ticks);
          expect(ticks.length).toEqual(34);
          expect(ticks[0].time).toEqual(1715187599);
          expect(ticks[0].priceBid).toEqual(516.62);
          expect(ticks[0].priceAsk).toEqual(516.63);
          expect(ticks[0].sizeBid).toEqual(1100);
          expect(ticks[0].sizeAsk).toEqual(1400);
        },
        complete: () => {
          done();
        },
        error: () => {
          done("Some error occured!");
        },
      });
  });
});
