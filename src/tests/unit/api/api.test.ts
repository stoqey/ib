/**
 * This file implement test code for the public API interfaces.
 */
import { Contract, ErrorCode, EventName, IBApi, Option, OptionType, SecType, TickType } from "../../..";
import configuration from "../../../common/configuration";
import logger from "../../../common/logger";

const TEST_SERVER_HOST = configuration.ib_host;
const TEST_SERVER_PORT = configuration.ib_port;

describe("IBApi Tests", () => {
  jest.setTimeout(10000);
  let _clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  let _account: string; // maintain account name for further tests
  let _conId: number; // maintain for conId for  further tests

  it("Test reqPositions / cancelPositions", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_PORT,
    }).connect(_clientId++);

    let positionsCount = 0;

    ib.on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
      expect(`${err.message} - code: ${code} - id: ${id}`).toBeFalsy();
    })
      .on(EventName.position, (account: string, contract: Contract, pos: number, avgCost: number) => {
        if (_account === undefined) {
          _account = account;
        }
        if (_conId === undefined && pos) {
          _conId = contract.conId;
        }
        expect(account).toBeTruthy();
        expect(contract).toBeTruthy();
        // expect(pos).toBeTruthy();  pos can be 0 when it has been closed today
        if (pos) expect(avgCost).toBeTruthy();
        positionsCount++;
      })
      .on(EventName.positionEnd, () => {
        if (positionsCount) {
          ib.disconnect();
          done();
        } else {
          logger.error("No Positions received");
        }
      });

    ib.reqPositions();
  });

  it("Test reqPnL / cancelPnL", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_PORT,
    });

    let received = false;

    ib.on(EventName.error, (err, code, id) => {
      expect(`${err.message} - code: ${code} - id: ${id}`).toBeFalsy();
    }).on(EventName.pnl, (reqId: number, pnl: number) => {
      expect(reqId).toEqual(43);
      expect(pnl).toBeTruthy();
      if (!received) {
        ib.cancelPnL(reqId);
        ib.disconnect();
        done();
      }
      received = true;
    });

    ib.connect(_clientId++).reqPnL(43, _account);
  });

  it("Test reqPnLSingle / cancelPnLSingle", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_PORT,
    }).connect(_clientId++);

    let received = false;

    ib.on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
      expect(`${err.message} - code: ${code} - id: ${id}`).toBeFalsy();
      done(`${err.message} - code: ${code} - id: ${id}`);
    }).on(
      EventName.pnlSingle,
      (reqId: number, pos: number, dailyPnL: number, unrealizedPnL: number, realizedPnL: number, value: number) => {
        expect(reqId).toEqual(44);
        expect(pos).toBeTruthy();
        expect(dailyPnL).toBeTruthy();
        expect(unrealizedPnL).toBeTruthy();
        // expect(realizedPnL).toBeTruthy();  We may have no realized PnL today
        expect(value).toBeTruthy();
        if (!received) {
          ib.cancelPnLSingle(reqId);
          ib.disconnect();
          done();
        }
        received = true;
      },
    );

    ib.reqPnLSingle(44, _account, null, _conId);
  });

  it("Test request tick history", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_PORT,
    }).connect(_clientId++);

    let isConnected = false;

    ib.on(EventName.connected, function onConnected() {
      isConnected = true;
    })
      .on(EventName.error, function onError(err: Error) {
        if (isConnected) {
          ib.disconnect();
        }
        throw err;
      })
      .on(EventName.historicalTicksLast, function onData(reqId: number, ticks: []) {
        expect(ticks.length).toBeGreaterThan(0);
        if (isConnected) {
          ib.disconnect();
        }
        done();
      });

    const contract: Contract = {
      symbol: "SPY",
      exchange: "SMART",
      currency: "USD",
      secType: SecType.STK,
    };

    ib.reqHistoricalTicks(45, contract, "20210101-16:00:00", null, 1000, "TRADES", 0, true);
  });

  it("Test request market data", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_PORT,
    }).connect(_clientId++);

    let received = false;
    let isConnected = false;

    ib.on(EventName.connected, function onConnected() {
      isConnected = true;
    })
      .on(EventName.error, (err, code, id) => {
        // should use expect(error).toEqual("<string message>")
        expect(`${err.message} - code: ${code} - id: ${id}`).toBeFalsy();
        if (isConnected) {
          ib.disconnect();
        }
        done(`${err.message} - code: ${code} - id: ${id}`);
      })
      .on(EventName.tickPrice, function onData(reqId: number, _field: TickType, _value: number) {
        expect(reqId).toEqual(45);
        if (!received) {
          ib.cancelMktData(reqId);
          ib.disconnect();
          done();
        }
        received = true;
      });

    const contract: Option = new Option("AAPL", "20251219", 200, OptionType.Put);

    ib.reqMktData(45, contract, "", true, false);
  });
});
