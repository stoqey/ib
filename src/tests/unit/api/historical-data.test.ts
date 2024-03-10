/**
 * This file implement test code for the public API interfaces.
 */
import {
  BarSizeSetting,
  Contract,
  EventName,
  IBApi,
  Option,
  OptionType,
  Stock,
  WhatToShow,
} from "../../..";
import configuration from "../../../common/configuration";

describe("IBApi Historical data Tests", () => {
  jest.setTimeout(10 * 1000);

  let ib: IBApi;
  const clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  beforeEach(() => {
    ib = new IBApi({
      host: configuration.ib_host,
      port: configuration.ib_port,
      clientId,
    });
    // logger.info("IBApi created");
  });

  afterEach(() => {
    if (ib) {
      ib.disconnect();
      ib = undefined;
    }
    // logger.info("IBApi disconnected");
  });

  it("Stock market data", (done) => {
    const refId = 46;
    let counter = 0;

    ib.once(EventName.connected, () => {
      const contract: Contract = new Stock("SPY");
      ib.reqHistoricalData(
        refId,
        contract,
        "20231006-20:00:00",
        "30 S",
        BarSizeSetting.SECONDS_ONE,
        WhatToShow.TRADES,
        0,
        2,
        false,
      );
    })
      .on(
        EventName.historicalData,
        (
          reqId: number,
          time: string,
          open: number,
          high: number,
          low: number,
          close: number,
          volume: number,
          count: number | undefined,
          WAP: number,
        ) => {
          //   console.log(
          //     counter,
          //     time,
          //     open,
          //     high,
          //     low,
          //     close,
          //     volume,
          //     count,
          //     WAP,
          //   );
          expect(reqId).toEqual(refId);
          if (time.startsWith("finished")) {
            expect(counter).toEqual(30);
            done();
          } else if (counter++ == 29) {
            expect(time).toEqual("1696622399");
            expect(open).toEqual(429.5);
            expect(high).toEqual(429.6);
            expect(low).toEqual(429.47);
            expect(close).toEqual(429.51);
            expect(volume).toEqual(3487.38);
            expect(count).toEqual(1090);
            expect(WAP).toEqual(429.532);
          }
        },
      )
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });

  test("Option market data", (done) => {
    const refId = 47;
    let counter = 0;

    ib.once(EventName.connected, () => {
      const contract: Option = new Option(
        "AAPL",
        "20251219",
        200,
        OptionType.Put,
      );
      ib.reqHistoricalData(
        refId,
        contract,
        "20240110-20:00:00",
        "30 S",
        BarSizeSetting.SECONDS_FIFTEEN,
        WhatToShow.BID_ASK,
        0,
        2,
        false,
      );
    })
      .on(
        EventName.historicalData,
        (
          reqId: number,
          time: string,
          open: number,
          high: number,
          low: number,
          close: number,
          volume: number,
          count: number | undefined,
          WAP: number,
        ) => {
          // console.log(
          //   counter,
          //   time,
          //   open,
          //   high,
          //   low,
          //   close,
          //   volume,
          //   count,
          //   WAP,
          // );
          expect(reqId).toEqual(refId);
          if (time.startsWith("finished")) {
            expect(counter).toEqual(2);
            done();
          } else if (counter++ == 1) {
            expect(time).toEqual("1704916785");
            expect(open).toEqual(25.65);
            expect(high).toEqual(25.65);
            expect(low).toEqual(25.65);
            expect(close).toEqual(25.65);
            expect(volume).toEqual(-1);
            expect(count).toEqual(-1);
            expect(WAP).toEqual(-1);
          }
        },
      )
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });

  it("Weekly market data", (done) => {
    const refId = 48;
    let counter = 0;

    ib.once(EventName.connected, () => {
      const contract: Contract = new Stock("SPY");
      ib.reqHistoricalData(
        refId,
        contract,
        "20230904-20:00:00",
        "1 M",
        BarSizeSetting.WEEKS_ONE,
        WhatToShow.TRADES,
        0,
        2,
        false,
      );
    })
      .on(
        EventName.historicalData,
        (
          reqId: number,
          time: string,
          open: number,
          high: number,
          low: number,
          close: number,
          volume: number,
          count: number | undefined,
          WAP: number,
        ) => {
          // console.log(
          //   counter,
          //   time,
          //   open,
          //   high,
          //   low,
          //   close,
          //   volume,
          //   count,
          //   WAP,
          // );
          expect(reqId).toEqual(refId);
          if (time.startsWith("finished")) {
            expect(counter).toEqual(5);
            done();
          } else if (counter++ == 4) {
            expect(time).toEqual("20230901");
            expect(open).toEqual(437.3);
            expect(high).toEqual(453.67);
            expect(low).toEqual(437.3);
            expect(close).toEqual(450.92);
            expect(volume).toEqual(2771783.24);
            expect(count).toEqual(1393264);
            expect(WAP).toEqual(448.476);
          }
        },
      )
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });

  it("Monthly market data", (done) => {
    const refId = 49;
    let counter = 0;

    ib.once(EventName.connected, () => {
      const contract: Contract = new Stock("SPY");
      ib.reqHistoricalData(
        refId,
        contract,
        "20230904-20:00:00",
        "1 Y",
        BarSizeSetting.MONTHS_ONE,
        WhatToShow.TRADES,
        0,
        2,
        false,
      );
    })
      .on(
        EventName.historicalData,
        (
          reqId: number,
          time: string,
          open: number,
          high: number,
          low: number,
          close: number,
          volume: number,
          count: number | undefined,
          WAP: number,
        ) => {
          // console.log(
          //   counter,
          //   time,
          //   open,
          //   high,
          //   low,
          //   close,
          //   volume,
          //   count,
          //   WAP,
          // );
          expect(reqId).toEqual(refId);
          if (time.startsWith("finished")) {
            expect(counter).toEqual(13);
            done();
          } else if (counter++ == 12) {
            expect(time).toEqual("20230901");
            expect(open).toEqual(451.53);
            expect(high).toEqual(453.67);
            expect(low).toEqual(449.68);
            expect(close).toEqual(450.92);
            expect(volume).toEqual(474058.9);
            expect(count).toEqual(248346);
            expect(WAP).toEqual(451.3);
          }
        },
      )
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });

  it("Test request tick history", (done) => {
    const refId = 45;
    let isConnected = false;

    ib.on(EventName.connected, () => {
      isConnected = true;
    })
      .on(EventName.historicalTicksLast, (reqId: number, ticks: []) => {
        expect(ticks.length).toBeGreaterThan(0);
        if (isConnected) {
          ib.disconnect();
        }
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    const contract: Contract = new Stock("SPY");

    ib.connect().reqHistoricalTicks(
      refId,
      contract,
      "20240102-16:00:00",
      null,
      10,
      WhatToShow.TRADES,
      0,
      true,
    );
  });
});
