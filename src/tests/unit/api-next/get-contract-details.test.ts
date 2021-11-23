/**
 * This file implements tests for the [[IBApiNext.getContractDetails]] function.
 */

import {
  IBApi,
  IBApiNext,
  IBApiNextError,
  EventName,
  ContractDetails,
} from "../../..";

describe("RxJS Wrapper: getContractDetails()", () => {
  test("Error Event", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a error event and verify RxJS result

    const testValue = "We want this error";

    apiNext
      .getContractDetails({})
      .then(fail)
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

    const testValue1 = "testValue1";
    const testValue2 = "testValue2";

    apiNext
      .getContractDetails({})
      .then((update) => {
        expect(update.length).toEqual(2);
        switch (update.length) {
          case 2:
            expect(update[1].marketName).toEqual(testValue2);
          // no break by intention
          case 1:
            expect(update[0].marketName).toEqual(testValue1);
            break;
        }
        done();
      })
      .catch((e) => {
        fail(e);
      });

    api.emit(EventName.contractDetails, 1, {
      marketName: testValue1,
    } as ContractDetails);

    api.emit(EventName.contractDetails, 1, {
      marketName: testValue2,
    } as ContractDetails);

    api.emit(EventName.contractDetailsEnd, 1);
  });
});
