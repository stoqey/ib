/**
 * This file implements tests for the [[IBApiNext.getContractDetails]] function.
 */

import { Subscription } from "rxjs";
import { IBApiNext, IBApiNextError } from "../../..";
import logger from "../../../common/logger";
import {
  sample_bond,
  sample_crypto,
  sample_future,
  sample_option,
  sample_stock,
} from "../sample-data/contracts";

describe("ApiNext: getContractDetails()", () => {
  jest.setTimeout(5_000);

  const clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  let api: IBApiNext;
  let error$: Subscription;

  beforeEach(() => {
    api = new IBApiNext();

    if (!error$) {
      error$ = api.errorSubject.subscribe((error) => {
        if (error.reqId === -1) {
          logger.warn(`${error.error.message} (Error #${error.code})`);
        } else {
          logger.error(
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
      logger.error(error.message);
    }
  });

  afterEach(() => {
    if (api) {
      api.disconnect();
      api = undefined;
    }
  });

  test("Stock contract details", (done) => {
    const ref_contract = sample_stock;

    api
      .getContractDetails(ref_contract)
      .then((result) => {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].contract.symbol).toEqual(ref_contract.symbol);
        expect(result[0].contract.secType).toEqual(ref_contract.secType);
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getContractDetails failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });

  test("Future contract details", (done) => {
    const ref_contract = sample_future;

    api
      .getContractDetails(ref_contract)
      .then((result) => {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].contract.symbol).toEqual(ref_contract.symbol);
        expect(result[0].contract.secType).toEqual(ref_contract.secType);
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getContractDetails failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });

  test("Crypto contract details", (done) => {
    const ref_contract = sample_crypto;

    api
      .getContractDetails(ref_contract)
      .then((result) => {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].contract.symbol).toEqual(ref_contract.symbol);
        expect(result[0].contract.secType).toEqual(ref_contract.secType);
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getContractDetails failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });

  test("Option contract details", (done) => {
    const ref_contract = sample_option;

    api
      .getContractDetails(ref_contract)
      .then((result) => {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].contract.symbol).toEqual(ref_contract.symbol);
        expect(result[0].contract.secType).toEqual(ref_contract.secType);
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getContractDetails failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });

  test("Bond contract details", (done) => {
    const ref_contract = sample_bond;

    api
      .getContractDetails(ref_contract)
      .then((result) => {
        expect(result.length).toBeGreaterThan(0);
        // expect(result[0].contract.symbol).toEqual(ref_contract.symbol);
        expect(result[0].contract.secType).toEqual(ref_contract.secType);
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getContractDetails failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });
});
