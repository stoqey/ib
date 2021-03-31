/**
 * This file implements tests for the [[IBApiNext.getCurrentTime]] function.
 */

import {
  IBApiNext,
  IBApiAutoConnection,
  IBApiNextError,
  EventName,
} from "../../..";

describe("RxJS Wrapper: getManagedAccounts()", () => {
  test("Promise result", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a EventName.managedAccounts and verify RxJS result

    apiNext
      .getManagedAccounts()
      .then((accounts) => {
        expect(accounts.length).toEqual(3);
        expect(accounts.find((v) => v === "U123456")).toEqual("U123456");
        expect(accounts.find((v) => v === "U987654")).toEqual("U987654");
        expect(accounts.find((v) => v === "U000000")).toEqual("U000000");
        done();
      })
      .catch((error: IBApiNextError) => {
        fail(error.error.message);
      });

    api.emit(EventName.managedAccounts, "U123456,U987654,U000000");
  });
});
