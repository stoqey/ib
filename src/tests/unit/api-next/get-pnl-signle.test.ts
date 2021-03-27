/**
 * This file implements tests for the [[IBApiNext.getPnLSingle]] function.
 */

import {
  IBApiNext,
  IBApiAutoConnection,
  IBApiNextError,
  EventName,
} from "../../..";

describe("RxJS Wrapper: getPnL()", () => {
  test("Error Event", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a error event and verify RxJS result

    const testValue = "We want this error";

    apiNext
      .getPnLSingle("U123456", null, 123345)
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
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a pnl event and verify RxJS result

    const position = 1;
    const dailyPnL = 2;
    const unrealizedPnL = 3;
    const realizedPnL = 4;
    const marketValue = 5;

    apiNext
      .getPnLSingle("U123456", null, 123345)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.position).toEqual(position);
          expect(pnl.dailyPnL).toEqual(dailyPnL);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL);
          expect(pnl.realizedPnL).toEqual(realizedPnL);
          expect(pnl.marketValue).toEqual(marketValue);
          done();
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(
      EventName.pnlSingle,
      1,
      position,
      dailyPnL,
      unrealizedPnL,
      realizedPnL,
      marketValue
    );
  });

  test("Initial value replay to late observers", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a pnl event and verify RxJS result

    const account = "U123456";
    const position = 1;
    const dailyPnL = 2;
    const unrealizedPnL = 3;
    const realizedPnL = 4;
    const marketValue = 5;

    apiNext
      .getPnLSingle(account, null, 123345)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: () => {
          apiNext
            .getPnLSingle(account, null, 123345)
            // eslint-disable-next-line rxjs/no-ignored-subscription
            .subscribe({
              next: (pnl) => {
                expect(pnl.position).toEqual(position);
                expect(pnl.dailyPnL).toEqual(dailyPnL);
                expect(pnl.unrealizedPnL).toEqual(unrealizedPnL);
                expect(pnl.realizedPnL).toEqual(realizedPnL);
                expect(pnl.marketValue).toEqual(marketValue);
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

    api.emit(
      EventName.pnlSingle,
      1,
      position,
      dailyPnL,
      unrealizedPnL,
      realizedPnL,
      marketValue
    );
  });

  test("Multiple contracts with multiple subscribers", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // testing values

    const account = "U123456";

    const condId1 = 12345;
    const position1 = 11;
    const dailyPnL1 = 12;
    const unrealizedPnL1 = 13;
    const realizedPnL1 = 14;
    const marketValue1 = 15;

    const condId2 = 64321;
    const position2 = 21;
    const dailyPnL2 = 22;
    const unrealizedPnL2 = 23;
    const realizedPnL2 = 24;
    const marketValue2 = 25;

    // emit as accountSummary event and verify all subscribers receive it

    let receivedConId1Updates = 0;
    let receivedConId2Updates = 0;

    // reqId 2

    apiNext
      .getPnLSingle(account, null, condId1)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.position).toEqual(position1);
          expect(pnl.dailyPnL).toEqual(dailyPnL1);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL1);
          expect(pnl.realizedPnL).toEqual(realizedPnL1);
          expect(pnl.marketValue).toEqual(marketValue1);
          receivedConId1Updates++;
          if (receivedConId1Updates == 2 && receivedConId2Updates == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    apiNext
      .getPnLSingle(account, null, condId1)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.position).toEqual(position1);
          expect(pnl.dailyPnL).toEqual(dailyPnL1);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL1);
          expect(pnl.realizedPnL).toEqual(realizedPnL1);
          expect(pnl.marketValue).toEqual(marketValue1);
          receivedConId1Updates++;
          if (receivedConId1Updates == 2 && receivedConId2Updates == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    // reqId 2

    apiNext
      .getPnLSingle(account, null, condId2)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.position).toEqual(position2);
          expect(pnl.dailyPnL).toEqual(dailyPnL2);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL2);
          expect(pnl.realizedPnL).toEqual(realizedPnL2);
          expect(pnl.marketValue).toEqual(marketValue2);
          receivedConId2Updates++;
          if (receivedConId1Updates == 2 && receivedConId2Updates == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    apiNext
      .getPnLSingle(account, null, condId2)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (pnl) => {
          expect(pnl.position).toEqual(position2);
          expect(pnl.dailyPnL).toEqual(dailyPnL2);
          expect(pnl.unrealizedPnL).toEqual(unrealizedPnL2);
          expect(pnl.realizedPnL).toEqual(realizedPnL2);
          expect(pnl.marketValue).toEqual(marketValue2);
          receivedConId2Updates++;
          if (receivedConId1Updates == 2 && receivedConId2Updates == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(
      EventName.pnlSingle,
      1,
      position1,
      dailyPnL1,
      unrealizedPnL1,
      realizedPnL1,
      marketValue1
    );
    api.emit(
      EventName.pnlSingle,
      2,
      position2,
      dailyPnL2,
      unrealizedPnL2,
      realizedPnL2,
      marketValue2
    );
  });
});
