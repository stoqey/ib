import {
  ContractDetails,
  EventName,
  IBApi,
  Instrument,
  isNonFatalError,
  LocationCode,
  ScanCode,
} from "../../..";
import configuration from "../../../common/configuration";
import logger from "../../../common/logger";

describe("IBApi market scanner tests", () => {
  jest.setTimeout(10_000);

  let ib: IBApi;
  const clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  beforeEach(() => {
    ib = new IBApi({
      host: configuration.ib_host,
      port: configuration.ib_port,
      clientId,
    });
  });

  afterEach(() => {
    ib.disconnect();
  });

  test("Scanner parameters", (done) => {
    ib.once(EventName.connected, () => {
      ib.reqScannerParameters();
    }).on(EventName.scannerParameters, (xml: string) => {
      const match = '<?xml version="1.0" encoding="UTF-8"?>'; // eslint-disable-line quotes
      expect(xml.substring(0, match.length)).toEqual(match);
      done();
    });

    ib.on(EventName.info, (msg, code) => logger.info(code, msg))
      .on(EventName.error, (error, code, reqId) => {
        const msg = `[${reqId}] ${error.message} (Error #${code})`;
        isNonFatalError(code, error) ? logger.warn(msg) : logger.error(msg);
      })
      .connect();
  });

  test("Most active US stocks", (done) => {
    const refId = 1;
    ib.once(EventName.connected, () => {
      ib.reqScannerSubscription(refId, {
        abovePrice: 1,
        scanCode: ScanCode.MOST_ACTIVE,
        locationCode: LocationCode.STK_US,
        instrument: Instrument.STK,
        numberOfRows: 20,
      });
    })
      .on(
        EventName.scannerData,
        (
          reqId,
          _rank: number,
          _contract: ContractDetails,
          _distance: string,
          _benchmark: string,
          _projection: string,
          _legStr: string,
        ) => {
          expect(reqId).toEqual(refId);
        },
      )
      .on(EventName.scannerDataEnd, (reqId) => {
        expect(reqId).toEqual(refId);
        done();
      });

    ib.on(EventName.info, (msg, code) => logger.info(code, msg))
      .on(EventName.error, (error, code, reqId) => {
        const msg = `[${reqId}] ${error.message} (Error #${code})`;
        isNonFatalError(code, error) ? logger.warn(msg) : logger.error(msg);
      })
      .connect();
  });
});
