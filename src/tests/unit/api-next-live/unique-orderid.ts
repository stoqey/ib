/**
 * This file implement test code for the placeOrder function .
 */
import { Subscription } from "rxjs";
import { IBApiNext } from "../../..";
import logger from "../../../common/logger";

const _timeoutPromise = async (secs: number, reason?: string): Promise<void> =>
  new Promise(
    (_, reject) =>
      setTimeout(() => reject(new Error(reason ?? "timeout")), secs * 1_000), // Fail after some time
  );

describe("Issue xxx", () => {
  jest.setTimeout(20 * 1_000);

  let clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client id

  let ib: IBApiNext;
  let error$: Subscription;

  beforeEach(() => {
    ib = new IBApiNext();

    if (!error$) {
      error$ = ib.errorSubject.subscribe((error) => {
        if (error.reqId === -1) {
          logger.warn(`${error.error.message} (Error #${error.code})`);
        } else {
          logger.error(
            `${error.error.message} (Error #${error.code}) ${
              error.advancedOrderReject ? error.advancedOrderReject : ""
            }`,
          );
        }
      });
    }

    try {
      ib.connect(clientId++);
    } catch (error: any) {
      logger.error(error.message);
    }
  });

  afterEach(() => {
    if (ib) {
      ib.disconnect();
    }
  });

  /*
  WIP
  */

  // test("Bug", async () => {
  //   return new Promise<void>(async (resolve, reject) => {
  //     let refId: number;

  //     const _ordersSubscription$ = ib.getOpenOrders().subscribe({
  //       next: (data) => {
  //         logger.debug(data.all.length);
  //         data.added?.forEach((item) => {
  //           if (item.orderId === refId) {
  //             logger.info(`Order #${refId} found in open orders.`);
  //             resolve();
  //           }
  //         });
  //       },
  //       error: (err: IBApiNextError) => {
  //         logger.error(`getOpenOrders failed with '${err.error.message}'`);
  //         reject(`getOpenOrders failed with '${err.error.message}'`);
  //       },
  //     });

  //     await ib
  //       .placeNewOrder(aapl_contract, sample_order)
  //       .then((orderId: number) => {
  //         logger.info(`Order #${orderId} posted.`);
  //       });

  //     await ib
  //       .placeNewOrder(aapl_contract, sample_order)
  //       .then((orderId: number) => {
  //         logger.info(`Order #${orderId} posted.`);
  //       });

  //     await ib
  //       .placeNewOrder(aapl_contract, sample_order)
  //       .then((orderId: number) => {
  //         logger.info(`Order #${orderId} posted.`);
  //         refId = orderId;
  //       });
  //   });
  // });
});
