/**
 * This file implements tests for the [[IBApiNext.getUserInfo]] function.
 */

import { Subscription } from "rxjs";
import { IBApiNext, isNonFatalError } from "../../..";
import logger from "../../../common/logger";

describe("ApiNext: getManagedAccounts()", () => {
  jest.setTimeout(5_000);

  let clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  const api: IBApiNext = new IBApiNext();

  const _error$: Subscription = api.errorSubject.subscribe((error) => {
    if (isNonFatalError(error.code, error.error)) {
      logger.warn(`${error.error.message} (Error #${error.code})`);
    } else {
      logger.error(
        `${error.error.message} (Error #${error.code}) ${
          error.advancedOrderReject ? error.advancedOrderReject : ""
        }`,
      );
    }
  });

  beforeEach(() => {
    api.connect(clientId++);
  });

  afterEach(() => {
    api.disconnect();
  });

  test("getUserInfo once", (done) => {
    const p: Promise<string>[] = [];

    p.push(api.getUserInfo());

    Promise.all(p).then((result) => {
      expect(result.length).toBeGreaterThan(0);
      // logger.info(result);
      done();
    });
  });

  test("getUserInfo n times", (done) => {
    const n = 10;
    const p: Promise<string>[] = [];
    for (let i = 0; i < n; i++) p.push(api.getUserInfo());

    Promise.all(p).then((result) => {
      // logger.info(result);
      expect(result.length).toBe(n);
      done();
    });
  });
});
