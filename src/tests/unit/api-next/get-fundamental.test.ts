/**
 * This file implements tests for the [[IBApiNext.getContractDetails]] function.
 */

import {
  EventName,
  IBApi,
  IBApiNext,
  IBApiNextError,
  Stock
} from "../../..";

describe("RxJS Wrapper: getFundamentalData()", () => {
  test("Error Event", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a error event and verify RxJS result

    const testValue = "We want this error";

    apiNext
      .getFundamentalData(new Stock("AAPL"), "ReportSnapshot", [])
      .then(() => done("failed, then should not be called!"))
      .catch((error: IBApiNextError) => {
        expect(error.error.message).toEqual(testValue);
        done();
      });

    api.emit(EventName.error, new Error(testValue), -1, 1);
  });

  test("Incremental collection", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit contractDetails and contractDetailsEnd event and verify all subscribers receive it

    const testValue1 = "testValue1 --- is not an xml string";

    apiNext
      .getFundamentalData(new Stock("AAPL"), "ReportSnapshot", [])
      .then((data) => {
        expect(data).toEqual(testValue1);
        done();
      })
      .catch((error: IBApiNextError) => {
        fail(error.error.message);
      });

    api.emit(EventName.fundamentalData, 1, testValue1);
  });
});
