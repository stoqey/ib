/**
 * This file implements tests for the [[IBApiNext.getCurrentTime]] function.
 */

import {
  IBApiNext,
  IBApiAutoConnection,
  IBApiNextError,
  EventName,
} from "../../..";

describe("RxJS Wrapper: getCurrentTime()", () => {
  test("Promise result", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a EventName.currentTime and verify RxJS result

    const testValue = Math.random();

    apiNext
      .getCurrentTime()
      .then((time) => {
        expect(time).toEqual(testValue);
        done();
      })
      .catch((error: IBApiNextError) => {
        fail(error.error.message);
      });

    api.emit(EventName.currentTime, testValue);
  });
});
