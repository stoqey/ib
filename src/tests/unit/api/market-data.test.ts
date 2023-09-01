/**
 * This file implement test code for the public API interfaces.
 */
import { Contract, EventName, IBApi, Option, OptionType, SecType, TickType } from "../../..";
import configuration from "../../../common/configuration";

describe("IBApi Market data Tests", () => {
  jest.setTimeout(20000);

  let ib: IBApi;
  let clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

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

  it("Stock market data", (done) => {
    let received = false;
    let refId = 46;

    ib.on(EventName.connected, () => {
      const contract: Contract = { symbol: "SPY", currency: "USD", secType: SecType.STK, exchange: "SMART" };
      ib.reqMktData(refId, contract, "", true, false);
    })
      .on(EventName.error, (err, code, id) => {
        // should use expect(error).toEqual("<string message>")
        expect(`${err.message} - code: ${code} - id: ${id}`).toBeFalsy();
        ib.disconnect();
      })
      .on(EventName.tickPrice, (reqId: number, _field: TickType, _value: number) => {
        expect(reqId).toEqual(refId);
        if (reqId == refId) received = true;
        // console.log(_field, _value);
      })
      .on(EventName.tickSnapshotEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      });

    ib.connect();
  });

  test("Option market data", (done) => {
    let received = false;
    let refId = 47;

    ib.on(EventName.connected, () => {
      const contract: Option = new Option("AAPL", "20251219", 200, OptionType.Put);
      ib.reqMktData(refId, contract, "", true, false);
    })
      .on(EventName.error, (err, code, id) => {
        // should use expect(error).toEqual("<string message>")
        expect(`${err.message} - code: ${code} - id: ${id}`).toBeFalsy();
        ib.disconnect();
      })
      .on(EventName.tickPrice, (reqId: number, _field: TickType, _value: number) => {
        expect(reqId).toEqual(refId);
        if (reqId == refId) received = true;
      })
      .on(EventName.tickSnapshotEnd, (reqId: number) => {
        expect(reqId).toEqual(refId);
        if (received) done();
        else done("Didn't get any result");
      });

    ib.connect();
  });
});
