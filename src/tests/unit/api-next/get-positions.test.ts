/**
 * This file implements tests for the [[IBApiNext.getPositions]] function.
 */

import {
  Contract,
  EventName,
  IBApi,
  IBApiNext,
  IBApiNextError,
} from "../../..";

describe("RxJS Wrapper: getPositions()", () => {
  test("Update multicast", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // testing values

    const accountId = "DU123456";
    const positionContract: Contract = { conId: 1 };
    const posSize = 1000;
    const avgCost = 100;

    // emit position event and verify all subscribers receive it

    let received = 0;

    apiNext
      .getPositions()
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: () => {
          received++;
          if (received === 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          done(error.error.message);
        },
      });

    apiNext
      .getPositions()
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: () => {
          received++;
          if (received === 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          done(error.error.message);
        },
      });

    api.emit(EventName.position, accountId, positionContract, posSize, avgCost);
    api.emit(EventName.positionEnd);
  });

  test("Detected added / changed / removed", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // testing values

    const accountId = "DU123456";
    const positionContract: Contract = { conId: 1 };
    const posSize1 = 1000;
    const posSize2 = 2000;
    const avgCost = 100;

    // emit a position event and verify RxJS result

    // eslint-disable-next-line rxjs/no-ignored-subscription
    apiNext.getPositions().subscribe({
      next: (update) => {
        if (update.added?.size) {
          expect(update.all.size).toEqual(1);
          expect(update.added.get(accountId)[0].contract.conId).toEqual(
            positionContract.conId,
          );
          expect(update.added.get(accountId)[0].pos).toEqual(posSize1);
          expect(update.added.get(accountId)[0].avgCost).toEqual(avgCost);
        } else if (update.changed?.size) {
          expect(update.all.size).toEqual(1);
          expect(update.changed.get(accountId)[0].contract.conId).toEqual(
            positionContract.conId,
          );
          expect(update.changed.get(accountId)[0].pos).toEqual(posSize2);
          expect(update.changed.get(accountId)[0].avgCost).toEqual(avgCost);
          done();
        } else {
          done("Didn't get result");
        }
      },
      error: (error: IBApiNextError) => {
        done(error.error.message);
      },
    });

    api.emit(
      EventName.position,
      accountId,
      positionContract,
      posSize1,
      avgCost,
    );
    api.emit(EventName.positionEnd);
    api.emit(
      EventName.position,
      accountId,
      positionContract,
      posSize2,
      avgCost,
    );
  });

  test("Initial value replay to late observers", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // testing values

    const accountId = "DU123456";
    const positionContract: Contract = { conId: 1 };
    const posSize = 1000;
    const avgCost = 100;

    // emit a position event and verify RxJS result

    // eslint-disable-next-line rxjs/no-ignored-subscription
    apiNext.getPositions().subscribe({
      next: () => {
        // eslint-disable-next-line rxjs/no-ignored-subscription
        apiNext.getPositions().subscribe({
          next: (update) => {
            expect(update.all.size).toEqual(1);
            expect(update.all.size).toEqual(update.added.size);
            expect(update.all.get(accountId)[0].contract.conId).toEqual(
              positionContract.conId,
            );
            expect(update.all.get(accountId)[0].pos).toEqual(posSize);
            expect(update.all.get(accountId)[0].avgCost).toEqual(avgCost);
            expect(update.added.get(accountId)[0].contract.conId).toEqual(
              positionContract.conId,
            );
            expect(update.added.get(accountId)[0].pos).toEqual(posSize);
            expect(update.added.get(accountId)[0].avgCost).toEqual(avgCost);
            done();
          },
          error: (error: IBApiNextError) => {
            done(error.error.message);
          },
        });
      },
      error: (error: IBApiNextError) => {
        done(error.error.message);
      },
    });

    api.emit(EventName.position, accountId, positionContract, posSize, avgCost);
    api.emit(EventName.positionEnd);
  });
});
