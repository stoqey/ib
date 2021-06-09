/**
 * This file implements tests for the [[IBApiNext.getMarketDepthExchanges]] function.
 */
import { IBApi, IBApiNext, IBApiNextError } from "../../..";

describe("RxJS Wrapper: getMarketDepthL2()", () => {
  test("Insert rows", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // Emit a EventName.updateMktDepth event, adding new rows to both, bid and ask side
    // and verify RxJS result.

    apiNext
      .getMarketDepth({}, 100, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          // TODO:
          // verify update.all is the full order book
          // verify update.added has the emitted change
          // call done() after done
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    // TODO emit insert events

    // insert bid on 0
    //api.emit(EventName.updateMktDepth, ..

    // insert bid on 1
    //api.emit(EventName.updateMktDepth, ..

    // insert ask on 0
    //api.emit(EventName.updateMktDepth, ..

    // insert ask on 1
    //api.emit(EventName.updateMktDepth, ..
  });

  test("Update rows", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // Emit a EventName.updateMktDepth event, updating rows to both, bid and ask side
    // and verify RxJS result.

    apiNext
      .getMarketDepth({}, 100, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          // TODO:
          // verify update.all is the full order book
          // verify update.added has the emitted change when added
          // verify update.change has the emitted change when changed
          // call done() after done
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    // TODO emit insert events

    // insert bid on 0
    //api.emit(EventName.updateMktDepth, ..

    // change bid on 0
    //api.emit(EventName.updateMktDepth, ..

    // insert ask on 0
    //api.emit(EventName.updateMktDepth, ..

    // change ask on 0
    //api.emit(EventName.updateMktDepth, ..
  });

  test("Update rows", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // Emit a EventName.updateMktDepth event, deleting rows to both, bid and ask side
    // and verify RxJS result.

    apiNext
      .getMarketDepth({}, 100, false)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          // TODO:
          // verify update.all is the full order book
          // verify update.added has the emitted change when added
          // verify update.removed has the emitted change when deleted
          // call done() after done
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    // TODO emit insert events

    // insert bid on 0
    //api.emit(EventName.updateMktDepth, ..

    // deleted bid on 0
    //api.emit(EventName.updateMktDepth, ..

    // insert ask on 0
    //api.emit(EventName.updateMktDepth, ..

    // deleted ask on 0
    //api.emit(EventName.updateMktDepth, ..
  });
});
