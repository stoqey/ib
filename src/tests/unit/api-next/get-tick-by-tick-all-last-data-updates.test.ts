/**
 * This file implements tests for the [[IBApiNext.getTickByTickAllLastDataUpdates]] function.
 */

import {
  Contract,
  EventName,
  IBApi,
  IBApiNext,
  IBApiNextError,
  SecType,
} from "../../..";
import { TickByTickAllLast } from "../../../api/market/tickByTickAllLast";

describe("RxJS Wrapper: getTickByTickAllLastDataUpdates()", () => {
  test("Observable updates", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit EventName.tickByTickAllLast events and verify RxJS result

    const contract: Contract = {
      symbol: "AMZN",
      exchange: "SMART",
      currency: "USD",
      secType: SecType.STK,
    };

    const REF_TICKS: TickByTickAllLast[] = [
      {
        contract,
        time: 1675228123,
        price: 1,
        size: 2,
        tickAttribLast: {
          pastLimit: false,
          unreported: false,
        },
        exchange: "EXCHANGE",
        specialConditions: "SPECIAL_CONDITIONS",
      },
      {
        contract,
        time: 1675228124,
        price: 11,
        size: 12,
        tickAttribLast: {
          pastLimit: false,
          unreported: false,
        },
        exchange: "EXCHANGE",
        specialConditions: "SPECIAL_CONDITIONS",
      },
      {
        contract,
        time: 1675228125,
        price: 21,
        size: 22,
        tickAttribLast: {
          pastLimit: false,
          unreported: false,
        },
        exchange: "EXCHANGE",
        specialConditions: "SPECIAL_CONDITIONS",
      },
    ];

    let updateCount = 0;

    apiNext
      .getTickByTickAllLastDataUpdates(contract, 0, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          expect(update.contract).toEqual(REF_TICKS[updateCount].contract);
          expect(update.time).toEqual(REF_TICKS[updateCount].time);
          expect(update.price).toEqual(REF_TICKS[updateCount].price);
          expect(update.size).toEqual(REF_TICKS[updateCount].size);
          expect(update.tickAttribLast).toEqual(REF_TICKS[updateCount].tickAttribLast);
          expect(update.exchange).toEqual(REF_TICKS[updateCount].exchange);
          expect(update.specialConditions).toEqual(REF_TICKS[updateCount].specialConditions);

          updateCount++;
          if (updateCount >= REF_TICKS.length) {
            done();
          }
        },
        error: (err: IBApiNextError) => {
          fail(err.error.message);
        },
      });

    for (let i = 0; i < REF_TICKS.length; i++) {
      api.emit(
        EventName.tickByTickAllLast,
        1,
        REF_TICKS[i].time,
        REF_TICKS[i].price,
        REF_TICKS[i].size,
        REF_TICKS[i].tickAttribLast,
        REF_TICKS[i].exchange,
        REF_TICKS[i].specialConditions,
      );
    }
  });
});
