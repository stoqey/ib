/**
 * This file implement test code for the public API interfaces.
 */


import { assert } from "chai";
import { IBApi, EventName }  from "..";

const TEST_SERVER_HOST = "localhost";
const TEST_SERVER_POST = 4001;

describe("IBApi Tests", () => {

  it("Test connect / disconnect", (done) => {

    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST
    });

    ib.on(EventName.connected, () => {
      ib.disconnect();
    }).on(EventName.disconnected, () => {
      done();
    }).on(EventName.error, (err: Error) => {
      assert.fail(err.message);
    });

    ib.connect();
  });

  it("Test reqPositions / cancelPositions", (done) => {

    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_POST
    });

    let positionsCount = 0;

    ib.on(EventName.connected, () => {
      ib.reqPositions();
    }).on(EventName.error, (err: Error) => {
      assert.fail(err.message);
    }).on(EventName.position, () => {
      positionsCount++;
    }).on(EventName.positionEnd, () => {
      if (positionsCount) {
        done();
      } else {
        assert.fail("No Positions received");
      }
      ib.disconnect();
    });

    ib.connect();
  });
});
