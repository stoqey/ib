import { getMarketDataTickDisplayValue } from "../../../tools/common/ib-api-next-app";

describe("IBApiNextApp market data formatting", () => {
  test("prefers numeric tick values including zero", () => {
    expect(
      getMarketDataTickDisplayValue({
        value: 0,
        stringValue: "raw",
        ingressTm: 1,
      }),
    ).toEqual(0);
  });

  test("falls back to structured tickString values", () => {
    const rtVolume = "184.84;2;1718995200000;100;184.80;true";

    expect(
      getMarketDataTickDisplayValue({
        stringValue: rtVolume,
        ingressTm: 1,
      }),
    ).toEqual(rtVolume);
  });
});
