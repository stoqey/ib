/**
 * This file implements tests for the [[IBApiNext.getMarketData]] function.
 */

import { take } from "rxjs/operators";
import {
  IBApiNext,
  IBApiAutoConnection,
  IBApiNextError,
  EventName,
} from "../../..";
import { IBApiNextTickType, IBApiTickType } from "../../../api-next";
import TickType from "../../../api/market/tickType";

describe("RxJS Wrapper: getPnL()", () => {
  test("Error Event", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a error event and verify RxJS result

    const testValue = "We want this error";

    apiNext
      .getMarketData({ conId: 12345 }, null, false, false)
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

  test("tickPrice events", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a tickPrice events and verify RxJS result

    const testValueBid = Math.random();
    const testValueAsk = Math.random();

    apiNext
      .getMarketData({ conId: 12345 }, null, false, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (data) => {
          switch (data.all.size) {
            case 2:
              expect(data.all.get(TickType.ASK).value).toEqual(testValueAsk);
            // not break my intention
            case 1:
              expect(data.all.get(TickType.BID).value).toEqual(testValueBid);
              break;
          }
          if (data.all.size == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(EventName.tickPrice, 1, TickType.BID, testValueBid);
    api.emit(EventName.tickPrice, 1, TickType.ASK, testValueAsk);
  });

  test("tickSize events", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a tickSize events and verify RxJS result

    const testValueBid = Math.random();
    const testValueAsk = Math.random();

    apiNext
      .getMarketData({ conId: 12345 }, null, false, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (data) => {
          switch (data.all.size) {
            case 2:
              expect(data.all.get(TickType.ASK_SIZE).value).toEqual(
                testValueAsk
              );
            // not break my intention
            case 1:
              expect(data.all.get(TickType.BID_SIZE).value).toEqual(
                testValueBid
              );
              break;
          }
          if (data.all.size == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(EventName.tickSize, 1, TickType.BID_SIZE, testValueBid);
    api.emit(EventName.tickSize, 1, TickType.ASK_SIZE, testValueAsk);
  });

  test("tickGeneric events", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a tickGeneric events and verify RxJS result

    const testValue0 = 12345;
    const testValue1 = 54321;

    let received = 0;

    apiNext
      .getMarketData({ conId: 12345 }, null, false, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (data) => {
          if (received == 0) {
            expect(data.added).toBeDefined();
            expect(data.changed).toBeUndefined();
          } else {
            expect(data.added).toBeUndefined();
            expect(data.changed).toBeDefined();
          }
          expect(data.all.get(TickType.NEWS_TICK).value).toEqual(
            received ? testValue1 : testValue0
          );
          received++;
          if (received == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(EventName.tickGeneric, 1, TickType.NEWS_TICK, testValue0);
    api.emit(EventName.tickGeneric, 1, TickType.NEWS_TICK, testValue1);
  });

  test("tickOptionComputationHandler events", (done) => {
    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a tickOptionComputationHandler events and verify RxJS result

    const impliedVolatility = 1;
    const delta = 2;
    const optPrice = 3;
    const pvDividend = 4;
    const gamma = 5;
    const vega = 6;
    const theta = 7;
    const undPrice = 8;

    apiNext
      .getMarketData({ conId: 12345 }, null, false, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (data) => {
          expect(data.added.get(IBApiNextTickType.BID_OPTION_IV).value).toEqual(
            impliedVolatility
          );
          expect(
            data.added.get(IBApiNextTickType.BID_OPTION_DELTA).value
          ).toEqual(delta);
          expect(
            data.added.get(IBApiNextTickType.BID_OPTION_PRICE).value
          ).toEqual(optPrice);
          expect(
            data.added.get(IBApiNextTickType.BID_OPTION_GAMMA).value
          ).toEqual(gamma);
          expect(
            data.added.get(IBApiNextTickType.BID_OPTION_VEGA).value
          ).toEqual(vega);
          expect(
            data.added.get(IBApiNextTickType.BID_OPTION_THETA).value
          ).toEqual(theta);
          expect(data.all.get(IBApiNextTickType.BID_OPTION_IV).value).toEqual(
            impliedVolatility
          );
          expect(
            data.all.get(IBApiNextTickType.BID_OPTION_DELTA).value
          ).toEqual(delta);
          expect(
            data.all.get(IBApiNextTickType.BID_OPTION_PRICE).value
          ).toEqual(optPrice);
          expect(
            data.all.get(IBApiNextTickType.BID_OPTION_GAMMA).value
          ).toEqual(gamma);
          expect(data.all.get(IBApiNextTickType.BID_OPTION_VEGA).value).toEqual(
            vega
          );
          expect(
            data.all.get(IBApiNextTickType.BID_OPTION_THETA).value
          ).toEqual(theta);
          done();
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(
      EventName.tickOptionComputation,
      1,
      IBApiTickType.BID_OPTION,
      impliedVolatility,
      delta,
      optPrice,
      pvDividend,
      gamma,
      vega,
      theta,
      undPrice
    );
  });

  test("Initial value replay to late observers", (done) => {
    // create IBApiNext and reqId counter

    const apiNext = new IBApiNext();
    const api = ((apiNext as unknown) as Record<string, unknown>)
      .api as IBApiAutoConnection;

    // emit a tickPrice events and verify RxJS result

    let testValue = 1;

    apiNext
      .getMarketData({ conId: 12345 }, null, false, false)
      .pipe(take(1))
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: () => {
          apiNext
            .getMarketData({ conId: 12345 }, null, false, false)
            // eslint-disable-next-line rxjs/no-ignored-subscription
            .subscribe({
              next: (data) => {
                expect(data.all.get(TickType.BID).value).toEqual(testValue);
                if (testValue == 1) {
                  expect(data.added.get(TickType.BID).value).toEqual(testValue);
                  expect(data.changed).toBeUndefined();
                } else if (testValue == 2) {
                  expect(data.added).toBeUndefined();
                  expect(data.changed.get(TickType.BID).value).toEqual(
                    testValue
                  );
                  done();
                  return;
                } else {
                  fail();
                }

                testValue = 2;
                api.emit(EventName.tickPrice, 1, TickType.BID, testValue);
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

    api.emit(EventName.tickPrice, 1, TickType.BID, testValue);
  });
});
