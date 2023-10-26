/**
 * This file implement test code for the public API interfaces.
 */
import { Contract, ErrorCode, EventName, IBApi } from "../../..";
import configuration from "../../../common/configuration";
import logger from "../../../common/logger";

describe("IBApi Tests", () => {
  jest.setTimeout(10000);

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
    if (ib) {
      ib.disconnect();
      ib = undefined;
    }
  });

  let _account: string; // maintain account name for further tests
  let _conId: number; // maintain for conId for  further tests

  it("Test reqPositions / cancelPositions", (done) => {
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
          if (_conId === undefined && pos) {
            _conId = contract.conId;
          }
          expect(account).toBeTruthy();
          expect(contract).toBeTruthy();
          // expect(pos).toBeTruthy();  pos can be 0 when it has been closed today
          if (pos) expect(avgCost).toBeTruthy();
          positionsCount++;
        },
      )
      .on(EventName.positionEnd, () => {
        if (positionsCount) {
          ib.disconnect();
          done();
        } else {
          logger.error("No Positions received");
        }
      });

    ib.connect().reqPositions();
  });

  it("Test reqPnL / cancelPnL", (done) => {
    const refId = 43;
    let received = false;

    ib.on(EventName.pnl, (reqId: number, _pnl: number) => {
      expect(reqId).toEqual(refId);
      // expect(pnl).toBeTruthy();
      if (!received) {
        ib.cancelPnL(reqId);
        ib.disconnect();
      }
      received = true;
    })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect().reqPnL(refId, _account);
  });

  it("Test reqPnLSingle / cancelPnLSingle", (done) => {
    const refId = 44;
    let received = false;

    ib.on(
      EventName.pnlSingle,
      (
        reqId: number,
        pos: number,
        dailyPnL: number,
        unrealizedPnL: number,
        realizedPnL: number,
        value: number,
      ) => {
        expect(reqId).toEqual(refId);
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
    ).on(EventName.error, (err, code, reqId) => {
      if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
    });

    ib.connect().reqPnLSingle(refId, _account, null, _conId);
  });
});
