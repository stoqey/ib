import { Contract, Order, OrderAction, OrderType, SecType } from "../../../..";
import MIN_SERVER_VER from "../../../../api/data/enum/min-server-version";
import { Encoder, EncoderCallbacks } from "../../../../core/io/encoder";

describe("Encoder placeOrder", () => {
  test("encodes attached child order quantity independently from parent id", () => {
    let sentTokens: unknown[] = [];
    const callbacks: EncoderCallbacks = {
      serverVersion: MIN_SERVER_VER.CME_TAGGING_FIELDS,
      sendMsg: (...tokens: unknown[]) => {
        sentTokens = tokens.flat(Infinity);
      },
      emitError: (message: string) => {
        throw new Error(message);
      },
    };
    const encoder = new Encoder(callbacks);
    const contract: Contract = {
      symbol: "SPY",
      secType: SecType.STK,
      exchange: "SMART",
      currency: "USD",
    };
    const childOrder: Order = {
      action: OrderAction.SELL,
      totalQuantity: 1,
      orderType: OrderType.LMT,
      lmtPrice: 101.25,
      tif: "GTC",
      account: "DU123",
      transmit: true,
      parentId: 1000,
    };

    encoder.placeOrder(1001, contract, childOrder);

    const actionIndex = sentTokens.indexOf(OrderAction.SELL);
    expect(actionIndex).toBeGreaterThan(-1);
    expect(sentTokens[actionIndex + 1]).toBe(1);
    expect(sentTokens[actionIndex + 2]).toBe(OrderType.LMT);
    expect(sentTokens[actionIndex + 11]).toBe(true);
    expect(sentTokens[actionIndex + 12]).toBe(1000);
  });
});
