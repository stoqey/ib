/**
 * This file implements tests for the [[IBApiNext.getAccountSummary]] function.
 */

import { take } from "rxjs/operators";
import { EventName, IBApi, IBApiNext, IBApiNextError } from "../../..";

describe("RxJS Wrapper: getAccountSummary()", () => {
  test("Error Event", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // emit a error event and verify RxJS result

    const testValue = "We want this error";

    apiNext
      .getAccountSummary("All", "NetLiquidation")
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: () => {
          fail();
        },
        error: (error: IBApiNextError) => {
          expect(error.error.message).toEqual(testValue);
          done();
        },
      });

    api.emit(EventName.error, new Error(testValue), -1, 1);
  });

  test("Update multicast", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // testing values

    const accountId1 = "DU123456";
    const accountId2 = "DU123456";
    const currency = "USD";
    const testValueReqId1 = "1111111";

    // emit as accountSummary event and verify all subscribers receive it

    // reqId 1 (All / NetLiquidation):

    let receivedNetLiquidation = 0;
    let receivedTotalCashValue = 0;

    apiNext
      .getAccountSummary("All", "NetLiquidation")
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          expect(
            update.all.get(accountId1)?.get("NetLiquidation")?.get(currency)
              ?.value,
          ).toEqual(testValueReqId1);
          receivedNetLiquidation++;
          if (receivedNetLiquidation == 2 && receivedTotalCashValue == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    apiNext
      .getAccountSummary("All", "NetLiquidation")
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          expect(
            update.all.get(accountId1)?.get("NetLiquidation")?.get(currency)
              ?.value,
          ).toEqual(testValueReqId1);
          receivedNetLiquidation++;
          if (receivedNetLiquidation == 2 && receivedTotalCashValue == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    // reqId 2 (used on All / TotalCashValue):

    apiNext
      .getAccountSummary("All", "TotalCashValue")
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          expect(
            update.all.get(accountId2)?.get("TotalCashValue")?.get(currency)
              ?.value,
          ).toEqual(testValueReqId1);
          receivedTotalCashValue++;
          if (receivedNetLiquidation == 2 && receivedTotalCashValue == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    apiNext
      .getAccountSummary("All", "TotalCashValue")
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          expect(
            update.all.get(accountId2)?.get("TotalCashValue")?.get(currency)
              ?.value,
          ).toEqual(testValueReqId1);
          receivedTotalCashValue++;
          if (receivedNetLiquidation == 2 && receivedTotalCashValue == 2) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(
      EventName.accountSummary,
      1,
      accountId1,
      "NetLiquidation",
      testValueReqId1,
      currency,
    );
    api.emit(EventName.accountSummaryEnd, 1);

    api.emit(
      EventName.accountSummary,
      2,
      accountId2,
      "TotalCashValue",
      testValueReqId1,
      currency,
    );
    api.emit(EventName.accountSummaryEnd, 2);
  });

  test("Aggregate into all", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // testing values

    const accountId1 = "DU123456";
    const accountId2 = "DU654321";
    const tagName1 = "NetLiquidation";
    const tagName2 = "TotalCashValue";
    const currency1 = "USD";
    const currency1Value = "1111111";
    const currency2 = "EUR";
    const currency2Value = "2222222";

    // emit a accountSummary events and verify RxJS result

    apiNext
      .getAccountSummary("All", `${tagName1},${tagName2}`)
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          expect(update.all).toBeDefined();
          expect(update.added).toBeDefined();
          expect(update.added.size).toEqual(1);

          let totalValuesCount = 0;
          update.all.forEach((tagValues) =>
            tagValues.forEach((currencyValues) => {
              totalValuesCount += currencyValues.size;
            }),
          );

          switch (totalValuesCount) {
            case 6:
              expect(
                update.all.get(accountId2)?.get(tagName2)?.get(currency2)
                  ?.value,
              ).toEqual(currency2Value);
            // no break by intention
            case 5:
              expect(
                update.all.get(accountId2)?.get(tagName2)?.get(currency1)
                  ?.value,
              ).toEqual(currency1Value);
            // no break by intention
            case 4:
              expect(
                update.all.get(accountId2)?.get(tagName1)?.get(currency2)
                  ?.value,
              ).toEqual(currency2Value);
            // no break by intention
            case 3:
              expect(
                update.all.get(accountId2)?.get(tagName1)?.get(currency1)
                  ?.value,
              ).toEqual(currency1Value);
            // no break by intention
            case 2:
              expect(
                update.all.get(accountId1)?.get(tagName1)?.get(currency2)
                  ?.value,
              ).toEqual(currency2Value);
            // no break by intention
            case 1:
              expect(
                update.all.get(accountId1)?.get(tagName1)?.get(currency1)
                  ?.value,
              ).toEqual(currency1Value);
              break;
          }
          if (totalValuesCount === 6) {
            done();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    // emit values

    api.emit(
      EventName.accountSummary,
      1,
      accountId1,
      tagName1,
      currency1Value,
      currency1,
    );
    api.emit(EventName.accountSummaryEnd, 1);

    api.emit(
      EventName.accountSummary,
      1,
      accountId1,
      tagName1,
      currency2Value,
      currency2,
    );

    api.emit(
      EventName.accountSummary,
      1,
      accountId2,
      tagName1,
      currency1Value,
      currency1,
    );

    api.emit(
      EventName.accountSummary,
      1,
      accountId2,
      tagName1,
      currency2Value,
      currency2,
    );

    api.emit(
      EventName.accountSummary,
      1,
      accountId2,
      tagName2,
      currency1Value,
      currency1,
    );

    api.emit(
      EventName.accountSummary,
      1,
      accountId2,
      tagName2,
      currency2Value,
      currency2,
    );
  });

  test("Detected changes", (done) => {
    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // testing values

    const accountId = "DU123456";
    const tagName = "NetLiquidation";
    const currency = "USD";
    const testValue1 = "1111111";
    const testValue2 = "2222222";

    // emit a accountSummary events and verify RxJS result

    apiNext
      .getAccountSummary("All", "NetLiquidation")
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          if (update.added?.size) {
            expect(
              update.added.get(accountId)?.get(tagName)?.get(currency)?.value,
            ).toEqual(testValue1);
          } else if (update.changed?.size) {
            expect(
              update.changed.get(accountId)?.get(tagName)?.get(currency)?.value,
            ).toEqual(testValue2);
            done();
          } else {
            fail();
          }
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(
      EventName.accountSummary,
      1,
      accountId,
      tagName,
      testValue1,
      currency,
    );
    api.emit(EventName.accountSummaryEnd, 1);

    api.emit(
      EventName.accountSummary,
      1,
      accountId,
      tagName,
      testValue2,
      currency,
    );
  });

  test("Initial value replay to late observers", (done) => {
    // create IBApiNext and reqId counter

    const apiNext = new IBApiNext();
    const api = (apiNext as unknown as Record<string, unknown>).api as IBApi;

    // testing values

    const accountId = "DU123456";
    const tagName = "NetLiquidation";
    const currency = "USD";
    const testValue = "1111111";

    // emit a single accountSummary event and verify that subscribers which join afterwards get it via initial event

    apiNext
      .getAccountSummary("All", "NetLiquidation")
      // eslint-disable-next-line rxjs/no-ignored-subscription
      .subscribe({
        next: (update) => {
          expect(
            update.added.get(accountId)?.get(tagName)?.get(currency)?.value,
          ).toEqual(testValue);

          apiNext
            .getAccountSummary("All", "NetLiquidation")
            .pipe(take(1))
            // eslint-disable-next-line rxjs/no-ignored-subscription
            .subscribe({
              next: (update) => {
                expect(
                  update.added.get(accountId)?.get(tagName)?.get(currency)
                    ?.value,
                ).toEqual(testValue);
                done();
              },
              error: (error: IBApiNextError) => {
                fail(error.error.message);
              },
            });
        },
        error: (error: IBApiNextError) => {
          fail(error.error.message);
        },
      });

    api.emit(
      EventName.accountSummary,
      1,
      accountId,
      tagName,
      testValue,
      currency,
    );
    api.emit(EventName.accountSummaryEnd, 1);
  });
});
