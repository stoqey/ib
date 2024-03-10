/**
 * This file implements tests for the [[reqContractDetails]] API entry point.
 */
import { ContractDetails, EventName, Forex, IBApi } from "../../..";
import configuration from "../../../common/configuration";
import { sample_option, sample_stock } from "../sample-data/contracts";

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
    const refContract = new Forex("USD", "EUR");
    ib.once(EventName.nextValidId, (_reqId) => {
      ib.reqContractDetails(refId, refContract);
    })
      .on(EventName.contractDetails, (reqId, details: ContractDetails) => {
        expect(reqId).toEqual(refId);
        expect(details.contract.secType).toEqual(refContract.secType);
        expect(details.contract.symbol).toEqual(refContract.symbol);
        expect(details.contract.currency).toEqual(refContract.currency);
        expect(details.marketName).toEqual(
          `${refContract.symbol}.${refContract.currency}`,
        );
      })
      .on(EventName.contractDetailsEnd, (reqId) => {
        expect(reqId).toEqual(refId);
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });

  test("Stock", (done) => {
    const refId = 2;
    const refContract = sample_stock;
    ib.once(EventName.nextValidId, (_reqId) => {
      ib.reqContractDetails(refId, refContract);
    })
      .on(EventName.contractDetails, (reqId, details: ContractDetails) => {
        expect(reqId).toEqual(refId);
        expect(details.contract.secType).toEqual(refContract.secType);
        expect(details.contract.symbol).toEqual(refContract.symbol);
        expect(details.contract.currency).toEqual(refContract.currency);
      })
      .on(EventName.contractDetailsEnd, (reqId) => {
        expect(reqId).toEqual(refId);
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });

  test("Option", (done) => {
    const refId = 3;
    const refContract = sample_option;
    ib.once(EventName.nextValidId, (_reqId) => {
      ib.reqContractDetails(refId, refContract);
    })
      .on(EventName.contractDetails, (reqId, details: ContractDetails) => {
        expect(reqId).toEqual(refId);
        expect(details.contract.secType).toEqual(refContract.secType);
        expect(details.contract.symbol).toEqual(refContract.symbol);
        expect(details.contract.currency).toEqual(refContract.currency);
        expect(details.contract.conId).toEqual(653318228);
      })
      .on(EventName.contractDetailsEnd, (reqId) => {
        expect(reqId).toEqual(refId);
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

    const refContract = sample_option;
    refContract.strike = 0;
    ib.once(EventName.nextValidId, (_reqId) => {
      ib.reqContractDetails(refId, refContract);
    })
      .on(EventName.contractDetails, (reqId, details: ContractDetails) => {
        expect(reqId).toEqual(refId);
        expect(details.contract.secType).toEqual(refContract.secType);
        expect(details.contract.symbol).toEqual(refContract.symbol);
        expect(details.contract.currency).toEqual(refContract.currency);
        count++;
      })
      .on(EventName.contractDetailsEnd, (reqId) => {
        expect(reqId).toEqual(refId);
        expect(count).toBeGreaterThanOrEqual(92);
        done();
      })
      .on(EventName.error, (err, code, reqId) => {
        if (reqId == refId) done(`[${reqId}] ${err.message} (#${code})`);
      });

    ib.connect();
  });
});
