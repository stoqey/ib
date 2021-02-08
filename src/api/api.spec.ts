/**
 * This file implement test code for the public API interfaces.
 */

import { assert } from "chai";
import { IBApi, EventName, Contract, ErrorCode } from "..";

const TEST_SERVER_HOST = "localhost";
const TEST_SERVER_POST = 4001;

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
        assert.fail(`${err.message} - code: ${code} - id: ${id}`);
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
      assert.fail(`${err.message} - code: ${code} - id: ${id}`);
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
          assert.isDefined(account);
          assert.isDefined(contract);
          assert.isDefined(pos);
          assert.isDefined(avgCost);
          positionsCount++;
        }
      )
      .on(EventName.positionEnd, () => {
        if (positionsCount) {
          ib.disconnect();
          done();
        } else {
          assert.fail("No Positions received");
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

    ib.on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
      assert.fail(`${err.message} - code: ${code} - id: ${id}`);
    }).on(EventName.pnl, (reqId: number, pnl: number) => {
      assert.equal(43, reqId);
      assert.isDefined(pnl);
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
      assert.fail(`${err.message} - code: ${code} - id: ${id}`);
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
        assert.equal(44, reqId);
        assert.isDefined(pos);
        assert.isDefined(dailyPnL);
        assert.isDefined(unrealizedPnL);
        assert.isDefined(realizedPnL);
        assert.isDefined(value);
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
