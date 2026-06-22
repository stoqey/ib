import { Crypto, Index, SecType } from "../../..";

describe("contract API exports", () => {
  test("exports Crypto from the package API", () => {
    const contract = new Crypto("BTC");

    expect(contract).toMatchObject({
      symbol: "BTC",
      exchange: "PAXOS",
      currency: "USD",
      secType: SecType.CRYPTO,
    });
  });

  test("uses exchange before currency for Index constructor arguments", () => {
    const contract = new Index("DAX", "EUREX", "EUR");

    expect(contract).toMatchObject({
      symbol: "DAX",
      exchange: "EUREX",
      currency: "EUR",
      secType: SecType.IND,
    });
  });
});
