/**
 * This file implement test code for the public API interfaces.
 */
import {
  ErrorCode,
  EventName,
  IBApi,
  MarketDataType,
  TickType,
} from "../../..";
import configuration from "../../../common/configuration";
import {
  sample_crypto,
  sample_dax_index,
  sample_etf,
  sample_future,
  sample_index,
  sample_option,
  sample_stock,
} from "../sample-data/contracts";

describe("IBApi Market data Tests", () => {
  jest.setTimeout(15 * 1000);

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

  const IsError = (code: ErrorCode) =>
    code !== ErrorCode.REQ_MKT_DATA_NOT_AVAIL &&
    code !== ErrorCode.DISPLAYING_DELAYED_DATA;

  it("ETF market data", (done) => {
    const refId = 45;
    let received = false;

    ib.once(EventName.connected, () => {
      ib.reqMktData(refId, sample_etf, "", true, false);
    })
      .on(
        EventName.tickPrice,
        (reqId: number, _field: TickType, _value: number) => {
          expect(reqId).toEqual(refId);
          if (reqId == refId) received = true;
          // console.log(_field, _value);
        },
      )
      .on(EventName.tickSnapshotEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      })
      .on(EventName.error, (err, code, reqId) => {
        if (IsError(code)) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqMarketDataType(MarketDataType.DELAYED_FROZEN);
  });

  it("Stock market data", (done) => {
    const refId = 46;
    let received = false;

    ib.once(EventName.connected, () => {
      ib.reqMktData(refId, sample_stock, "", true, false);
    })
      .on(
        EventName.tickPrice,
        (reqId: number, _field: TickType, _value: number) => {
          expect(reqId).toEqual(refId);
          if (reqId == refId) received = true;
          // console.log(_field, _value);
        },
      )
      .on(EventName.tickSnapshotEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      })
      .on(EventName.error, (err, code, reqId) => {
        if (IsError(code)) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqMarketDataType(MarketDataType.DELAYED_FROZEN);
  });

  test("Option market data", (done) => {
    const refId = 47;
    let received = false;

    ib.once(EventName.connected, () => {
      ib.reqMktData(refId, sample_option, "", true, false);
    })
      .on(
        EventName.tickPrice,
        (reqId: number, _field: TickType, _value: number) => {
          expect(reqId).toEqual(refId);
          if (reqId == refId) received = true;
        },
      )
      .on(EventName.tickSnapshotEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      })
      .on(EventName.error, (err, code, reqId) => {
        if (IsError(code)) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqMarketDataType(MarketDataType.DELAYED_FROZEN);
  });

  it("Future market data", (done) => {
    const refId = 48;
    let received = false;

    ib.once(EventName.connected, () => {
      ib.reqMktData(refId, sample_future, "", true, false);
    })
      .on(
        EventName.tickPrice,
        (reqId: number, _field: TickType, _value: number) => {
          expect(reqId).toEqual(refId);
          if (reqId == refId) received = true;
          // console.log(_field, _value);
        },
      )
      .on(EventName.tickSnapshotEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      })
      .on(EventName.error, (err, code, reqId) => {
        if (IsError(code)) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqMarketDataType(MarketDataType.DELAYED_FROZEN);
  });

  it("DAX market data", (done) => {
    const refId = 49;
    let received = false;

    ib.once(EventName.connected, () => {
      ib.reqMktData(refId, sample_dax_index, "", true, false);
    })
      .on(
        EventName.tickPrice,
        (reqId: number, _field: TickType, _value: number) => {
          expect(reqId).toEqual(refId);
          if (reqId == refId) received = true;
          // console.log(_field, _value);
        },
      )
      .on(EventName.tickSnapshotEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      })
      .on(EventName.error, (err, code: ErrorCode, reqId) => {
        if (IsError(code)) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqMarketDataType(MarketDataType.DELAYED_FROZEN);
  });

  it("Index market data", (done) => {
    const refId = 50;
    let received = false;

    ib.once(EventName.connected, () => {
      ib.reqMktData(refId, sample_index, "", true, false);
    })
      .on(
        EventName.tickPrice,
        (reqId: number, _field: TickType, _value: number) => {
          expect(reqId).toEqual(refId);
          if (reqId == refId) received = true;
          // console.log(_field, _value);
        },
      )
      .on(EventName.tickSnapshotEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      })
      .on(EventName.error, (err, code, reqId) => {
        if (IsError(code)) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqMarketDataType(MarketDataType.DELAYED_FROZEN);
  });

  it("Crypto market data", (done) => {
    const refId = 51;
    let received = false;

    ib.once(EventName.connected, () => {
      ib.reqMktData(refId, sample_crypto, "", true, false);
    })
      .on(
        EventName.tickPrice,
        (reqId: number, _field: TickType, _value: number) => {
          expect(reqId).toEqual(refId);
          if (reqId == refId) received = true;
          // console.log(_field, _value);
        },
      )
      .on(EventName.tickSnapshotEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      })
      .on(EventName.error, (err, code, reqId) => {
        if (IsError(code)) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqMarketDataType(MarketDataType.DELAYED_FROZEN);
  });
});
