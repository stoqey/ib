/**
 * This file implements tests for the [[IBApiNext.getContractDetails]] function.
 */

import { Subscription } from "rxjs";
import {
  ContractDetails,
  EventName,
  IBApi,
  IBApiNext,
  IBApiNextError,
} from "../../..";
import {
  sample_bond,
  sample_future,
  sample_option,
  sample_stock,
} from "../contracts";

describe("RxJS Wrapper: getContractDetails()", () => {
  test("Error Event", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a error event and verify RxJS result

    const testValue = "We want this error";

    apiNext
      .getContractDetails({})
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

describe("ApiNext: getContractDetails()", () => {
  jest.setTimeout(10 * 1000);

  const clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  let subscription$: Subscription;
  let api: IBApiNext;
  let error$: Subscription;

  beforeEach(() => {
    api = new IBApiNext();

    if (!error$) {
      error$ = api.errorSubject.subscribe((error) => {
        if (error.reqId === -1) {
          console.warn(`${error.error.message} (Error #${error.code})`);
        } else {
          console.error(
            `${error.error.message} (Error #${error.code}) ${
              error.advancedOrderReject ? error.advancedOrderReject : ""
            }`,
          );
        }
      });
    }

    try {
      api.connect(clientId);
    } catch (error) {
      console.error(error.message);
    }
  });

  afterEach(() => {
    if (api) {
      api.disconnect();
      api = undefined;
    }
  });

  test("Stock contract details", (done) => {
    api
      .getContractDetails(sample_stock)
      .then((result) => {
        // console.log(result);
        expect(result.length).toBeGreaterThan(0);
        if (result.length) {
          expect(result[0].contract.symbol).toEqual(sample_stock.symbol);
          expect(result[0].contract.secType).toEqual(sample_stock.secType);
        }
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getContractDetails failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });

  test("Future contract details", (done) => {
    api
      .getContractDetails(sample_future)
      .then((result) => {
        // console.log(result);
        expect(result.length).toBeGreaterThan(0);
        if (result.length) {
          expect(result[0].contract.symbol).toEqual(sample_future.symbol);
          expect(result[0].contract.secType).toEqual(sample_future.secType);
        }
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getContractDetails failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });

  test("Option contract details", (done) => {
    api
      .getContractDetails(sample_option)
      .then((result) => {
        // console.log(result);
        expect(result.length).toBeGreaterThan(0);
        if (result.length) {
          expect(result[0].contract.symbol).toEqual(sample_option.symbol);
          expect(result[0].contract.secType).toEqual(sample_option.secType);
        }
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getContractDetails failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });

  test("Bond contract details", (done) => {
    api
      .getContractDetails(sample_bond)
      .then((result) => {
        // console.log(result);
        expect(result.length).toBeGreaterThan(0);
        if (result.length) {
          expect(result[0].contract.secType).toEqual(sample_bond.secType);
        }
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getContractDetails failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });
});
