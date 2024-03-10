/**
 * This file implements tests for the [[IBApiNext.getContractDetails]] function.
 */

import { Subscription } from "rxjs";
import { IBApiNext, IBApiNextError } from "../../..";
import {
  sample_bond,
  sample_crypto,
  sample_option,
  sample_stock,
} from "../sample-data/contracts";

describe("ApiNext: getContractDetails()", () => {
  jest.setTimeout(10 * 1000);

  const clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

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
      .getContractDetails(sample_crypto)
      .then((result) => {
        // console.log(result);
        expect(result.length).toBeGreaterThan(0);
        if (result.length) {
          expect(result[0].contract.symbol).toEqual(sample_crypto.symbol);
          expect(result[0].contract.secType).toEqual(sample_crypto.secType);
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

  test("Crypto contract details", (done) => {
    api
      .getContractDetails(sample_crypto)
      .then((result) => {
        // console.log(result);
        expect(result.length).toBeGreaterThan(0);
        if (result.length) {
          expect(result[0].contract.symbol).toEqual(sample_crypto.symbol);
          expect(result[0].contract.secType).toEqual(sample_crypto.secType);
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
