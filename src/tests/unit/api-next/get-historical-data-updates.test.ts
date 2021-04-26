/**
 * This file implements tests for the [[IBApiNext.getHistoricalDataUpdates]] function.
 */

import { IBApi, IBApiNext, IBApiNextError, EventName, Bar } from "../../..";

describe("RxJS Wrapper: getHistoricalDataUpdates()", () => {
  test("Observable updates", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>).api as IBApi;

    // emit EventName.historicalData events and verify RxJS result

    const REF_BARS: Bar[] = [
      {
        time: "20210203 01:02:03",
        open: 1,
        high: 2,
        low: 3,
        close: 4,
        volume: 5,
        count: 6,
        WAP: 7,
      },
      {
        time: "20210203 02:02:03",
        open: 11,
        high: 12,
        low: 13,
        close: 14,
        volume: 15,
        count: 16,
        WAP: 17,
      },
      {
        time: "20210203 03:02:03",
        open: 21,
        high: 22,
        low: 23,
        close: 24,
        volume: 25,
        count: 26,
        WAP: 27,
      },
    ];

    let updateCount = 0;

    apiNext
      .getHistoricalDataUpdates({}, "", "", 0)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          expect(update.time).toEqual(REF_BARS[updateCount].time);
          expect(update.open).toEqual(REF_BARS[updateCount].open);
          expect(update.high).toEqual(REF_BARS[updateCount].high);
          expect(update.low).toEqual(REF_BARS[updateCount].low);
          expect(update.close).toEqual(REF_BARS[updateCount].close);
          expect(update.volume).toEqual(REF_BARS[updateCount].volume);
          expect(update.count).toEqual(REF_BARS[updateCount].count);
          expect(update.WAP).toEqual(REF_BARS[updateCount].WAP);

          updateCount++;
          if (updateCount >= REF_BARS.length) {
            done();
          }
        },
        error: (err: IBApiNextError) => {
          fail(err.error.message);
        },
      });

    for (let i = 0; i < REF_BARS.length; i++) {
      api.emit(
        EventName.historicalDataUpdate,
        1,
        REF_BARS[i].time,
        REF_BARS[i].open,
        REF_BARS[i].high,
        REF_BARS[i].low,
        REF_BARS[i].close,
        REF_BARS[i].volume,
        REF_BARS[i].count,
        REF_BARS[i].WAP
      );
    }
  });
});
