/**
 * This file implements tests for the [[IBApiNext.getMatchingSymbols]] function.
 */

import { fail } from "assert";
import {
  ContractDetails,
  EventName,
  IBApi,
  IBApiNext,
  IBApiNextError,
} from "../../..";

describe("RxJS Wrapper: searchContracts()", () => {
  test("Error Event", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a error event and verify RxJS result

    const testValue = "We want this error";

    apiNext
      .getMatchingSymbols("AAPL")
      .then(() => {
        fail();
      })
      .catch((e: IBApiNextError) => {
        expect(e.error.message).toEqual(testValue);
        done();
      });

    api.emit(EventName.error, new Error(testValue), -1, 1);
  });

  test("Result Event", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a result event and verify RxJS result

    const testValues: ContractDetails[] = [
      {
        contract: {
          conId: Math.random(),
        },
      },
      {
        contract: {
          conId: Math.random(),
        },
      },
    ];

    apiNext
      .getMatchingSymbols("AAPL")
      .then((result) => {
        expect(result).toEqual(testValues);
        done();
      })
      .catch((e: IBApiNextError) => {
        fail(e.error.message);
      });

    api.emit(EventName.symbolSamples, 1, testValues);
  });
});
