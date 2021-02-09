/**
 * This file implement test code for the public API interfaces.
 */
import { IBApi, EventName, Contract, ErrorCode } from "../../..";
import configuration from "../../../configuration/configuration";
import logger from "../../../utils/logger";

const TEST_SERVER_HOST = configuration.ib_test_host;
const TEST_SERVER_POST = configuration.ib_test_port;

describe("IBApi Tests", () => {
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
      .on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
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
});
