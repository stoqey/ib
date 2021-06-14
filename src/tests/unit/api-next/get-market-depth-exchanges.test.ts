/**
 * This file implements tests for the [[IBApiNext.getMarketDepthExchanges]] function.
 */

import {
  IBApi,
  IBApiNext,
  IBApiNextError,
  EventName,
  DepthMktDataDescription,
  SecType,
} from "../../..";

describe("RxJS Wrapper: getMarketDepthExchanges()", () => {
  test("Promise result", (done) => {
    // create IBApiNext

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a EventName.mktDepthExchanges and verify RxJS result

    const depthMktDataDescriptions: DepthMktDataDescription[] = [
      {
        exchange: "CME",
        secType: SecType.FUT,
      },
      {
        exchange: "Cboe",
        secType: SecType.OPT,
      },
    ];

    apiNext
      .getMarketDepthExchanges()
      .then((data) => {
        expect(data.length).toEqual(2);
        expect(data[0].exchange).toEqual(depthMktDataDescriptions[0].exchange);
        expect(data[0].secType).toEqual(depthMktDataDescriptions[0].secType);
        expect(data[1].exchange).toEqual(depthMktDataDescriptions[1].exchange);
        expect(data[1].secType).toEqual(depthMktDataDescriptions[1].secType);
        done();
      })
      .catch((error: IBApiNextError) => {
        fail(error.error.message);
      });

    api.emit(EventName.mktDepthExchanges, depthMktDataDescriptions);
  });
});
