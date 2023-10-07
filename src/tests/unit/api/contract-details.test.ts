/**
 * This file implements tests for the [[reqContractDetails]] API entry point.
 */
import {
  ContractDetails,
  EventName,
  Forex,
  IBApi,
  Option,
  OptionType,
  SecType,
  Stock,
} from "../../..";
import configuration from "../../../common/configuration";

describe("IBApi reqContractDetails Tests", () => {
  jest.setTimeout(5000);

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

  test("Forex", (done) => {
    const refId = 1;
    ib.once(EventName.nextValidId, (_reqId) => {
      const contract = new Forex("USD", "EUR");
      ib.reqContractDetails(refId, contract);
    })
      .on(EventName.contractDetails, (reqId, details: ContractDetails) => {
        expect(reqId).toEqual(refId);
        expect(details.contract.secType).toEqual(SecType.CASH);
        expect(details.contract.symbol).toEqual("EUR");
        expect(details.contract.currency).toEqual("USD");
        expect(details.marketName).toEqual("EUR.USD");
      })
      .on(EventName.contractDetailsEnd, (reqId) => {
        expect(reqId).toEqual(refId);
        if (ib) ib.disconnect();
      })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });

  test("Stock", (done) => {
    const refId = 2;
    ib.once(EventName.nextValidId, (_reqId) => {
      const contract = new Stock("SPY", "ARCA", "USD");
      ib.reqContractDetails(refId, contract);
    })
      .on(EventName.contractDetails, (reqId, details: ContractDetails) => {
        expect(reqId).toEqual(refId);
        expect(details.contract.secType).toEqual(SecType.STK);
        expect(details.contract.symbol).toEqual("SPY");
        expect(details.contract.currency).toEqual("USD");
        expect(details.marketName).toEqual("SPY");
      })
      .on(EventName.contractDetailsEnd, (reqId) => {
        expect(reqId).toEqual(refId);
        if (ib) ib.disconnect();
      })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });

  test("Option", (done) => {
    const refId = 3;
    ib.once(EventName.nextValidId, (_reqId) => {
      const contract = new Option("SPY", "20260116", 440, OptionType.Call);
      ib.reqContractDetails(refId, contract);
    })
      .on(EventName.contractDetails, (reqId, details: ContractDetails) => {
        expect(reqId).toEqual(refId);
        expect(details.contract.secType).toEqual(SecType.OPT);
        expect(details.contract.symbol).toEqual("SPY");
        expect(details.contract.currency).toEqual("USD");
        expect(details.contract.conId).toEqual(653318228);
        expect(details.marketName).toEqual("SPY");
      })
      .on(EventName.contractDetailsEnd, (reqId) => {
        expect(reqId).toEqual(refId);
        if (ib) ib.disconnect();
      })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });

  test("Option chain", (done) => {
    const refId = 4;
    let count = 0;

    ib.once(EventName.nextValidId, (_reqId) => {
      const contract = new Option("SPY", "20260116", 0, OptionType.Call);
      ib.reqContractDetails(refId, contract);
    })
      .on(EventName.contractDetails, (reqId, details: ContractDetails) => {
        expect(reqId).toEqual(refId);
        expect(details.contract.secType).toEqual(SecType.OPT);
        expect(details.contract.symbol).toEqual("SPY");
        expect(details.contract.currency).toEqual("USD");
        expect(details.marketName).toEqual("SPY");
        // console.log(details.contract);
        count++;
      })
      .on(EventName.contractDetailsEnd, (reqId) => {
        expect(reqId).toEqual(refId);
        expect(count).toBeGreaterThanOrEqual(92);
        // console.log(count);
        if (ib) ib.disconnect();
      })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });
});
