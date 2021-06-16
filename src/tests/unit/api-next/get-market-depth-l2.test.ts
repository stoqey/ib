/**
 * This file implements tests for the [[IBApiNext.getMarketDepthExchanges]] function.
 */
import { EventName, IBApi, IBApiNext, IBApiNextError } from "../../..";

describe("RxJS Wrapper: getMarketDepthL2()", () => {
  test("Insert rows", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    let eventCount = 0;

    apiNext
      .getMarketDepth({}, 100, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          switch (eventCount) {
            case 0:
              expect(update.all.asks.size).toEqual(1);
              expect(update.all.asks.get(0).price).toEqual(1);
              expect(update.all.asks.get(0).size).toEqual(2);
              break;
            case 1:
              expect(update.all.asks.size).toEqual(1);
              expect(update.all.asks.get(0).price).toEqual(1);
              expect(update.all.asks.get(0).size).toEqual(2);
              expect(update.all.bids.size).toEqual(1);
              expect(update.all.bids.get(0).price).toEqual(11);
              expect(update.all.bids.get(0).size).toEqual(12);
              break;
            case 2:
              expect(update.all.asks.size).toEqual(2);
              expect(update.all.asks.get(0).price).toEqual(1);
              expect(update.all.asks.get(0).size).toEqual(2);
              expect(update.all.asks.get(1).price).toEqual(21);
              expect(update.all.asks.get(1).size).toEqual(22);
              expect(update.all.bids.size).toEqual(1);
              expect(update.all.bids.get(0).price).toEqual(11);
              expect(update.all.bids.get(0).size).toEqual(12);
              break;
            case 3:
              expect(update.all.asks.size).toEqual(2);
              expect(update.all.asks.get(0).price).toEqual(1);
              expect(update.all.asks.get(0).size).toEqual(2);
              expect(update.all.asks.get(1).price).toEqual(21);
              expect(update.all.asks.get(1).size).toEqual(22);
              expect(update.all.bids.size).toEqual(2);
              expect(update.all.bids.get(0).price).toEqual(11);
              expect(update.all.bids.get(0).size).toEqual(12);
              expect(update.all.bids.get(1).price).toEqual(31);
              expect(update.all.bids.get(1).size).toEqual(32);
              done();
              break;
            default:
              fail();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      0 /* position */,
      0 /* insert */,
      0 /* ask */,
      1 /* price */,
      2 /* size */
    );
    eventCount++;

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      0 /* position */,
      0 /* insert */,
      1 /* bid */,
      11 /* price */,
      12 /* size */
    );
    eventCount++;

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      1 /* position */,
      0 /* insert */,
      0 /* ask */,
      21 /* price */,
      22 /* size */
    );
    eventCount++;

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      1 /* position */,
      0 /* insert */,
      1 /* bid */,
      31 /* price */,
      32 /* size */
    );
    eventCount++;
  });

  test("Update rows", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    let eventCount = 0;

    apiNext
      .getMarketDepth({}, 100, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          switch (eventCount) {
            case 0:
              expect(update.all.asks.size).toEqual(1);
              expect(update.all.asks.get(0).price).toEqual(1);
              expect(update.all.asks.get(0).size).toEqual(2);
              break;
            case 1:
              expect(update.all.asks.size).toEqual(1);
              expect(update.all.asks.get(0).price).toEqual(11);
              expect(update.all.asks.get(0).size).toEqual(12);
              break;
            case 2:
              expect(update.all.asks.size).toEqual(1);
              expect(update.all.asks.get(0).price).toEqual(11);
              expect(update.all.asks.get(0).size).toEqual(12);
              expect(update.all.bids.size).toEqual(1);
              expect(update.all.bids.get(0).price).toEqual(1);
              expect(update.all.bids.get(0).size).toEqual(2);
              break;
            case 3:
              expect(update.all.asks.size).toEqual(1);
              expect(update.all.asks.get(0).price).toEqual(11);
              expect(update.all.asks.get(0).size).toEqual(12);
              expect(update.all.bids.size).toEqual(1);
              expect(update.all.bids.get(0).price).toEqual(11);
              expect(update.all.bids.get(0).size).toEqual(12);
              done();
              break;
            default:
              fail();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    // TODO emit insert events

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      0 /* position */,
      0 /* insert */,
      0 /* ask */,
      1 /* price */,
      2 /* size */
    );
    eventCount++;

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      0 /* position */,
      1 /* update */,
      0 /* ask */,
      11 /* price */,
      12 /* size */
    );
    eventCount++;

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      0 /* position */,
      0 /* insert */,
      1 /* bid */,
      1 /* price */,
      2 /* size */
    );
    eventCount++;

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      0 /* position */,
      1 /* update */,
      1 /* bid */,
      11 /* price */,
      12 /* size */
    );
    eventCount++;
  });

  test("Delete rows", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    let eventCount = 0;

    apiNext
      .getMarketDepth({}, 100, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          switch (eventCount) {
            case 0:
              expect(update.all.asks.size).toEqual(1);
              expect(update.all.asks.get(0).price).toEqual(1);
              expect(update.all.asks.get(0).size).toEqual(2);
              break;
            case 1:
              expect(update.all.asks.size).toEqual(0);
              done();
              break;
            default:
              fail();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      0 /* position */,
      0 /* insert */,
      0 /* ask */,
      1 /* price */,
      2 /* size */
    );
    eventCount++;

    api.emit(
      EventName.updateMktDepth,
      1 /* ticker id */,
      0 /* position */,
      2 /* delete */,
      0 /* ask */,
      11 /* price */,
      12 /* size */
    );
    eventCount++;
  });
});
