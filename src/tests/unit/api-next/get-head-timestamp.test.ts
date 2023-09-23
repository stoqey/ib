/**
 * This file implements tests for the [[IBApiNext.getHeadTimestamp]] function.
 */

import {
  EventName,
  IBApi,
  IBApiNext,
  IBApiNextError,
  WhatToShow,
} from "../../..";

describe("RxJS Wrapper: getHeadTimestamp()", () => {
  test("Promise result", (done) => {
    // create IBApiNext
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a EventName.headTimestamp and verify RxJS result
    const testValue = Math.random();
    apiNext
      .getHeadTimestamp({}, WhatToShow.TRADES, true, 1)
      .then((time) => {
        expect(time).toEqual(testValue);
        done();
      })
      .catch((error: IBApiNextError) => {
        fail(error.error.message);
      });

    api.emit(EventName.headTimestamp, 1, testValue);
  });
});
