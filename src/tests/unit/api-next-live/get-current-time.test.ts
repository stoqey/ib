/**
 * This file implements tests for the [[IBApiNext.getCurrentTime]] function.
 */

import { Subscription } from "rxjs";
import { IBApiNext, IBApiNextError, isNonFatalError } from "../../..";
import logger from "../../../common/logger";

describe("ApiNext: getCurrentTime()", () => {
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

  test("getCurrentTime once", (done) => {
    api
      .getCurrentTime()
      .then((result) => {
        // logger.info(result);
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getCurrentTime failed with '${err.error.message}' (Error #${err.code})`,
        );
      });
  });

  test("getCurrentTime twice", (done) => {
    const p1 = api.getCurrentTime();
    const p2 = api.getCurrentTime();

    Promise.all([p1, p2])
      .then((result) => {
        // logger.info(result[0], result[1]);
        done();
      })
      .catch((err: IBApiNextError) => {
        done(
          `getCurrentTime failed with '${err.error?.message}' (Error #${err.code})`,
        );
      });
  });

  test("getCurrentTime n times", (done) => {
    const n = 10;
    const p: Promise<number>[] = [];
    for (let i = 0; i < n; i++) p.push(api.getCurrentTime());

    Promise.all(p).then((result) => {
      // logger.info(result);
      expect(result.length).toBe(n);
      done();
    });
  });
});
