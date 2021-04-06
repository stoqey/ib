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
    const api = ((apiNext as unknown) as Record<string, unknown>).api as IBApi;

    // emit a error event and verify RxJS result

    const testValue = "We want this error";

    apiNext
      .getContractDetails({})
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: () => {
          fail();
        },
        error: (error: IBApiNextError) => {
          expect(error.error.message).toEqual(testValue);
          done();
        },
      });

    api.emit(EventName.error, new Error(testValue), -1, 1);
  });

  test("Incremental collection", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>).api as IBApi;

    // emit contractDetails and contractDetailsEnd event and verify all subscribers receive it

    const testValue1 = "testValue1";
    const testValue2 = "testValue2";

    apiNext
      .getContractDetails({})
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          expect(update.changed).toBeUndefined();
          expect(update.removed).toBeUndefined();
          expect(update.added.length).toEqual(1);
          switch (update.all.length) {
            case 2:
              expect(update.all[1].marketName).toEqual(testValue2);
            // no break by intention
            case 1:
              expect(update.all[0].marketName).toEqual(testValue1);
              break;
          }
        },
        complete: () => {
          done();
        },
        error: () => {
          fail();
        },
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
