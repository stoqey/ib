/**
 * This file implement test code for the public API interfaces.
 */
import { Contract, ErrorCode, EventName, IBApi, SecType } from "../../..";
import configuration from "../../../common/configuration";
import logger from "../../../common/logger";

const TEST_SERVER_HOST = configuration.ib_host;
const TEST_SERVER_POST = configuration.ib_port;

describe("IBApi Tests", () => {
  jest.setTimeout(30000);
  let _clientId = 0; // ensure unique client

  it("Test connect / disconnect", (done) => {
    const ib = new IBApi({
      clientId: _clientId++,
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST,
    });

    ib.on(EventName.connected, () => {
      ib.disconnect();
    })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(EventName.error, (err, code, id) => {
        expect(`${err.message} - code: ${code} - id: ${id}`).toBeTruthy();
      });

    ib.connect();
  });

  let _account: string; // maintain account name for further tests
  let _conId: number; // maintain for conId for  further tests

  it("Test reqPositions / cancelPositions", (done) => {
    const ib = new IBApi({
      clientId: _clientId++,
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST,
    }).connect();

    let positionsCount = 0;

    ib.on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
      expect(`${err.message} - code: ${code} - id: ${id}`).toBeFalsy();
    })
      .on(
        EventName.position,
        (account: string, contract: Contract, pos: number, avgCost: number) => {
          if (_account === undefined) {
            _account = account;
          }
          if (_conId === undefined) {
            _conId = contract.conId;
          }
          expect(account).toBeTruthy();
          expect(contract).toBeTruthy();
          expect(pos).toBeTruthy();
          expect(avgCost).toBeTruthy();
          positionsCount++;
        }
      )
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

  it("Test reqPnL / cancelPositions", (done) => {
    const ib = new IBApi({
      clientId: _clientId++,
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST,
    }).connect();

    let received = false;

    ib.on(EventName.error, (err, code, id) => {
      // should use expect(error).toEqual("<string message>")
      expect(`${err.message} - code: ${code} - id: ${id}`).toBeTruthy();
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

    ib.reqPnL(43, _account);
  });

  it("Test reqPnLSingle / cancelPnLSingle", (done) => {
    const ib = new IBApi({
      clientId: _clientId++,
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST,
    }).connect();

    let received = false;

    ib.on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
      expect(`${err.message} - code: ${code} - id: ${id}`).toBeTruthy();
    }).on(
      EventName.pnlSingle,
      (
        reqId: number,
        pos: number,
        dailyPnL: number,
        unrealizedPnL: number,
        realizedPnL: number,
        value: number
      ) => {
        expect(reqId).toEqual(44);
        expect(pos).toBeTruthy();
        expect(dailyPnL).toBeTruthy();
        expect(unrealizedPnL).toBeTruthy();
        expect(realizedPnL).toBeTruthy();
        expect(value).toBeTruthy();
        if (!received) {
          ib.cancelPnLSingle(reqId);
          ib.disconnect();
          done();
        }
        received = true;
      }
    );

    ib.reqPnLSingle(44, _account, null, _conId);
  });

  it("Test request tick history", async function (done) {
    const ib = new IBApi({
      clientId: _clientId++,
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST,
    }).connect();

    let isConnected = false;

    ib
      .on(EventName.connected, function onConnected() {
        isConnected = true;
      })
      .on(EventName.error, function onError(err: Error) {
        if (isConnected) {
          ib.disconnect();
        }
        throw err;
      })
      .on(
        EventName.historicalTicksLast,
        function onData(reqId: number, ticks: []) {
          expect(ticks.length).toBeGreaterThan(0);
          if (isConnected) {
            ib.disconnect();
          }
          done();
        }
      );

    const contract: Contract = {
      symbol: "SPY",
      exchange: "SMART",
      currency: "USD",
      secType: SecType.STK
    };

    ib.reqHistoricalTicks(
      45,
      contract,
      "20210101 10:00:00",
      null,
      1000,
      "TRADES",
      0,
      true
    );
  });
});
