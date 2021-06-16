/**
 * This file implements tests for the [[IBApiNext.getHistogramData]] function.
 */

import { IBApi, IBApiNext, IBApiNextError, EventName } from "../../..";
import DurationUnit from "../../../api/data/enum/duration-unit";
import HistogramEntry from "../../../api/historical/histogramEntry";

describe("RxJS Wrapper: getHistogramData()", () => {
  test("Promise result", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a EventName.histogramData and verify RxJS result

    const refData: HistogramEntry[] = [
      { price: 1, size: 2 },
      { price: 11, size: 12 },
      { price: 21, size: 22 },
    ];

    apiNext
      .getHistogramData({}, true, 1, DurationUnit.DAY)
      .then((data) => {
        expect(data.length).toEqual(refData.length);
        refData.forEach((r, i) => {
          expect(r.price).toEqual(refData[i].price);
          expect(r.size).toEqual(refData[i].size);
        });
        done();
      })
      .catch((error: IBApiNextError) => {
        fail(error.error.message);
      });

    api.emit(EventName.histogramData, 1, refData);
  });
});
