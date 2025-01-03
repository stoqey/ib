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
            // console.info(JSON.stringify(contract));
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

    ib.once(EventName.connected, () => {
      // console.log("reqPnLSingle", refId);
      ib.reqPnLSingle(refId, _account, "", _conId);
    }).on(
      EventName.pnlSingle,
      (
        reqId: number,
        pos: number,
        _dailyPnL: number,
        unrealizedPnL: number,
        _realizedPnL: number,
        value: number,
      ) => {
        // console.log(
        //   "pnlSingle",
        //   reqId,
        //   pos,
        //   _dailyPnL,
        //   unrealizedPnL,
        //   _realizedPnL,
        //   value,
        // );
        expect(reqId).toEqual(refId);
        expect(pos).toBeTruthy();
        // expect(dailyPnL).toBeTruthy(); We may have no daily PnL (on week-ends)
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

    ib.on(EventName.disconnected, () => done())
      // .on(EventName.info, (msg, code) => console.info("INFO", code, msg))
      .on(EventName.error, (err, code, reqId) => {
        const msg = `[${reqId}] ${err.message} (#${code})`;
        if (
          reqId > 0 &&
          code != ErrorCode.INVALID_POSITION_TRADE_DERIVATED_VALUE
        ) {
          done(msg);
        } else {
          logger.error(msg);
        }
      })
      .connect();
  });
});
