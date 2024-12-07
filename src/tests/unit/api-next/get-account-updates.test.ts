/**
 * This file implements tests for the [[IBApiNext.getAccountSummary]] function.
 */

import { EventName, IBApi, IBApiNext, IBApiNextError } from "../../..";
import { sample_etf, sample_stock } from "../sample-data/contracts";

describe("RxJS Wrapper: getAccountUpdates()", () => {
  test("Update multicast", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // testing values
    const accountId1 = "DU123456";
    const accountId2 = "DU654321";
    const currency = "USD";

    apiNext
      .getAccountUpdates()
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          if (update.changed?.timestamp == "now") {
            expect(update.all.value.get(accountId1)).toBeDefined();
            expect(
              update.all.value.get(accountId1).get("tag").get(currency).value,
            ).toBe("value1");
            expect(update.all.portfolio.get(accountId1)).toBeDefined();
            expect(update.all.portfolio.get(accountId1)[0].account).toBe(
              accountId1,
            );
            expect(
              update.all.portfolio.get(accountId1)[0].contract.symbol,
            ).toBe(sample_etf.symbol);

            expect(update.all.value.get(accountId2)).toBeDefined();
            expect(
              update.all.value.get(accountId2).get("tag").get(currency).value,
            ).toBe("value2");
            expect(update.all.portfolio.get(accountId2)).toBeDefined();
            expect(update.all.portfolio.get(accountId2)[0].account).toBe(
              accountId2,
            );
            expect(
              update.all.portfolio.get(accountId2)[0].contract.symbol,
            ).toBe(sample_stock.symbol);
          } else if (update.changed?.timestamp == "later") done();
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    apiNext
      .getAccountUpdates(accountId1)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          if (update.changed?.timestamp == "now") {
            expect(update.all.value.get(accountId1)).toBeDefined();
            expect(
              update.all.value.get(accountId1).get("tag").get(currency).value,
            ).toBe("value1");
            expect(update.all.portfolio.get(accountId1)).toBeDefined();
            expect(update.all.portfolio.get(accountId1)[0].account).toBe(
              accountId1,
            );
            expect(
              update.all.portfolio.get(accountId1)[0].contract.symbol,
            ).toBe(sample_etf.symbol);

            expect(update.all.value.get(accountId2)).toBeUndefined();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    apiNext
      .getAccountUpdates(accountId2)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          if (update.changed?.timestamp == "now") {
            expect(update.all.value.get(accountId1)).toBeUndefined();

            expect(update.all.value.get(accountId2)).toBeDefined();
            expect(
              update.all.value.get(accountId2).get("tag").get(currency).value,
            ).toBe("value2");
            expect(update.all.portfolio.get(accountId2)).toBeDefined();
            expect(update.all.portfolio.get(accountId2)[0].account).toBe(
              accountId2,
            );
            expect(
              update.all.portfolio.get(accountId2)[0].contract.symbol,
            ).toBe(sample_stock.symbol);
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(
      EventName.updateAccountValue,
      "tag",
      "value1",
      currency,
      accountId1,
    );
    api.emit(
      EventName.updatePortfolio,
      sample_etf,
      1,
      10,
      100,
      9,
      10,
      0,
      accountId1,
    );
    api.emit(EventName.accountDownloadEnd, accountId1);

    api.emit(
      EventName.updateAccountValue,
      "tag",
      "value2",
      currency,
      accountId2,
    );
    api.emit(
      EventName.updatePortfolio,
      sample_stock,
      1,
      10,
      100,
      9,
      10,
      0,
      accountId2,
    );
    api.emit(EventName.accountDownloadEnd, accountId2);

    api.emit(EventName.updateAccountTime, "now");
    api.emit(EventName.updateAccountTime, "later");
  });
});
