/**
 * This file implements tests for the [[IBApiNext.getPnL]] function.
 */

import { IBApi, IBApiNext, IBApiNextError, EventName } from "../../..";

describe("RxJS Wrapper: getPnL()", () => {
  test("Error Event", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>).api as IBApi;

    // emit a error event and verify RxJS result

    const testValue = "We want this error";

    apiNext
      .getPnL("U123456")
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

  test("Value update", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>).api as IBApi;

    // emit a pnl event and verify RxJS result

    const dailyPnL = 1234;
    const unrealizedPnL = 56788;
    const realizedPnL = 901234;

    apiNext
      .getPnL("U123456")
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.dailyPnL).toEqual(dailyPnL);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL);
          expect(pnl.realizedPnL).toEqual(realizedPnL);
          done();
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(EventName.pnl, 1, dailyPnL, unrealizedPnL, realizedPnL);
  });

  test("Initial value replay to late observers", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>).api as IBApi;

    // emit a pnl event and verify RxJS result

    const dailyPnL = 1234;
    const unrealizedPnL = 56788;
    const realizedPnL = 901234;

    apiNext
      .getPnL("U123456")
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: () => {
          apiNext
            .getPnL("U123456")
            // eslint-disable-next-line rxjs/no-ignored-subscription
            .subscribe({
              next: (pnl) => {
                expect(pnl.dailyPnL).toEqual(dailyPnL);
                expect(pnl.unrealizedPnL).toEqual(unrealizedPnL);
                expect(pnl.realizedPnL).toEqual(realizedPnL);
                done();
              },
              error: (error: IBApiNextError) => {
                fail(error.error.message);
              },
            });
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(EventName.pnl, 1, dailyPnL, unrealizedPnL, realizedPnL);
  });

  test("Multi-account with multiple-subscribers", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>).api as IBApi;

    // testing values

    const accountId1 = "DU123456";
    const accountId2 = "DU123456";

    const dailyPnL = 1234;
    const unrealizedPnL = 56788;
    const realizedPnL = 901234;

    // emit as accountSummary event and verify all subscribers receive it

    let receivedAccount1Updates = 0;
    let receivedAccount2Updates = 0;

    // reqId 2

    apiNext
      .getPnL(accountId1)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.dailyPnL).toEqual(dailyPnL);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL);
          expect(pnl.realizedPnL).toEqual(realizedPnL);
          receivedAccount1Updates++;
          if (receivedAccount1Updates == 2 && receivedAccount2Updates == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    apiNext
      .getPnL(accountId1)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.dailyPnL).toEqual(dailyPnL);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL);
          expect(pnl.realizedPnL).toEqual(realizedPnL);
          receivedAccount1Updates++;
          if (receivedAccount1Updates == 2 && receivedAccount2Updates == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    // reqId 2

    apiNext
      .getPnL(accountId2)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.dailyPnL).toEqual(dailyPnL);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL);
          expect(pnl.realizedPnL).toEqual(realizedPnL);
          receivedAccount2Updates++;
          if (receivedAccount1Updates == 2 && receivedAccount2Updates == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    apiNext
      .getPnL(accountId2)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.dailyPnL).toEqual(dailyPnL);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL);
          expect(pnl.realizedPnL).toEqual(realizedPnL);
          receivedAccount2Updates++;
          if (receivedAccount1Updates == 2 && receivedAccount2Updates == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(EventName.pnl, 1, dailyPnL, unrealizedPnL, realizedPnL);
    api.emit(EventName.pnl, 2, dailyPnL, unrealizedPnL, realizedPnL);
  });
});
