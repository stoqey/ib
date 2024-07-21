/**
 * This file implement test code for the public API interfaces.
 */
import { Contract, ErrorCode, EventName, IBApi } from "../../..";
import configuration from "../../../common/configuration";
import logger from "../../../common/logger";

describe("IBApi Tests", () => {
  jest.setTimeout(15_000);

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

  async function delay(secs) {
    const res = await new Promise((resolve, reject) => {
      setTimeout(() => {
        return resolve(true);
      }, secs * 1_000);
    });
    return res;
  }

  it("Test reqPositions / cancelPositions", (done) => {
    let positionsCount = 0;

    ib.on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
      expect(`${err.message} - code: ${code} - id: ${id}`).toBeFalsy();
    })
      .on(
        EventName.position,
        (account: string, contract: Contract, pos: number, avgCost: number) => {
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

  it("Test reqPositionsMulti / cancelPositionsMulti", (done) => {
    let refId = 45;
    let count = 0;

    ib.once(EventName.connected, () => {
      ib.reqPositionsMulti(refId, "", "");
    })
      .on(
        EventName.positionMulti,
        (reqId, account, modelCode, contract, pos, avgCost) => {
          //   console.log(
          //     "positionMulti",
          //     reqId,
          //     account,
          //     modelCode,
          //     JSON.stringify(contract),
          //     pos,
          //     avgCost,
          //   );
          expect(account).toBeTruthy();
          expect(contract).toBeTruthy();
        },
      )
      .on(EventName.positionMultiEnd, (reqId) => {
        count += 1;
        // console.log("positionMultiEnd", reqId);
        refId = reqId + 1;
        ib.cancelPositionsMulti(refId);
        // console.log("cancelPositionsMulti sent", refId);
        if (count < 3) {
          //   console.log("count", count);
          refId = refId + 1;
          ib.reqPositionsMulti(refId, "", "");
          // console.log("reqPositionsMulti sent", refId);
        } else {
          done();
        }
      });

    ib.on(EventName.disconnected, () => done())
      .on(EventName.info, (msg, code) => console.info("INFO", code, msg))
      .on(EventName.error, (err, code, reqId) => {
        if (reqId > 0) done(`[${reqId}] ${err.message} (#${code})`);
        else console.error("ERROR", err.message, code, reqId);
      })
      .connect();
  });
});
