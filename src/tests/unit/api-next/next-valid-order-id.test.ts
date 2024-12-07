/**
 * This file implements tests for the [[IBApiNext.getCurrentTime]] function.
 */

import { EventName, IBApi, IBApiNext, IBApiNextError } from "../../..";

describe("RxJS Wrapper: getNextValidOrderId()", () => {
  test("Promise result", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a EventName.nextValidId and verify RxJS result

    const testValue = Math.ceil(Math.random() * 10_000);

    apiNext
      .getNextValidOrderId()
      .then((time) => {
        expect(time).toEqual(testValue);
        done();
      })
      .catch((error: IBApiNextError) => {
        fail(error.error.message);
      });

    api.emit(EventName.nextValidId, testValue);
  });
});
