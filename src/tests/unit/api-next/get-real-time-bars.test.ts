/**
 * This file implements tests for the [[IBApiNext.getRealTimeBars]] function.
 */

import { Bar, EventName, IBApi, IBApiNext, IBApiNextError } from "../../..";
import { WhatToShow } from "../../../api/historical/what-to-show";

describe("RxJS Wrapper: getRealTimeBars()", () => {
  test("requests fixed five second bars and cancels on unsubscribe", () => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;
    const contract = { conId: 12345 };
    const reqRealTimeBars = jest
      .spyOn(api, "reqRealTimeBars")
      .mockReturnValue(api);
    const cancelRealTimeBars = jest
      .spyOn(api, "cancelRealTimeBars")
      .mockReturnValue(api);
    jest.spyOn(api, "isConnected", "get").mockReturnValue(true);

    const subscription = apiNext.getRealTimeBars(contract).subscribe({
      error: (err: IBApiNextError) => {
        fail(err.error.message);
      },
    });

    api.emit(EventName.connected);

    expect(reqRealTimeBars).toHaveBeenCalledWith(
      expect.any(Number),
      contract,
      5,
      WhatToShow.TRADES,
      false,
    );

    subscription.unsubscribe();

    expect(cancelRealTimeBars).toHaveBeenCalledWith(
      reqRealTimeBars.mock.calls[0][0],
    );
  });

  test("emits realtimeBar events as bars", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;
    const refBar: Bar = {
      time: "1718995200",
      open: 1,
      high: 2,
      low: 3,
      close: 4,
      volume: 5,
      WAP: 6,
      count: 7,
    };

    const subscription = apiNext
      .getRealTimeBars({ conId: 12345 }, WhatToShow.BID, true)
      .subscribe({
        next: (bar) => {
          expect(bar).toEqual(refBar);
          subscription.unsubscribe();
          done();
        },
        error: (err: IBApiNextError) => {
          fail(err.error.message);
        },
      });

    api.emit(
      EventName.realtimeBar,
      1,
      Number(refBar.time),
      refBar.open,
      refBar.high,
      refBar.low,
      refBar.close,
      refBar.volume,
      refBar.WAP,
      refBar.count,
    );
  });

  test("omits unavailable realtimeBar fields", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    const subscription = apiNext.getRealTimeBars({ conId: 12345 }).subscribe({
      next: (bar) => {
        expect(bar).toEqual({
          time: "1718995200",
          open: 1,
          high: 2,
          low: 3,
          close: 4,
        });
        subscription.unsubscribe();
        done();
      },
      error: (err: IBApiNextError) => {
        fail(err.error.message);
      },
    });

    api.emit(EventName.realtimeBar, 1, 1718995200, 1, 2, 3, 4, -1, -1, -1);
  });
});
