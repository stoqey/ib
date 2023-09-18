import { IBApi } from "../../../api/api";
import ContractDescription from "../../../api/contract/contractDescription";
import { EventName } from "../../../api/data/enum/event-name";
import configuration from "../../../common/configuration";

describe("IBApi reqMatchingSymbols Tests", () => {
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

  test("SPY", (done) => {
    let tickerId: number;
    ib.once(EventName.nextValidId, (reqId) => {
      tickerId = reqId;
      ib.reqMatchingSymbols(reqId, "SPY");
    })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(
        EventName.symbolSamples,
        (reqId, contractDescriptions: ContractDescription[]) => {
          expect(reqId).toEqual(tickerId);
          expect(contractDescriptions[0].contract.symbol).toEqual("SPY");
          ib.disconnect();
        },
      );

    ib.connect();
  });

  test("META", (done) => {
    let tickerId: number;
    ib.once(EventName.nextValidId, (reqId) => {
      tickerId = reqId;
      ib.reqMatchingSymbols(reqId, "META");
    })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(
        EventName.symbolSamples,
        (reqId, contractDescriptions: ContractDescription[]) => {
          expect(reqId).toEqual(tickerId);
          expect(contractDescriptions[0].contract.symbol).toEqual("META");
          ib.disconnect();
        },
      );

    ib.connect();
  });

  test("AMC", (done) => {
    let tickerId: number;
    ib.once(EventName.nextValidId, (reqId) => {
      tickerId = reqId;
      ib.reqMatchingSymbols(reqId, "AMC");
    })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(
        EventName.symbolSamples,
        (reqId, contractDescriptions: ContractDescription[]) => {
          expect(reqId).toEqual(tickerId);
          expect(contractDescriptions[0].contract.symbol).toEqual("AMC");
          ib.disconnect();
        },
      );

    ib.connect();
  });
});
