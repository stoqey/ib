import { Subscription } from "rxjs";
import { IBApiNext, IBApiNextError } from "../../..";
import logger from "../../../common/logger";

describe("Subscription registry Tests", () => {
  jest.setTimeout(2_000);

  const clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  let subscription$: Subscription;
  let api: IBApiNext;
  let error$: Subscription;

  beforeEach(() => {
    api = new IBApiNext();

    if (!error$) {
      error$ = api.errorSubject.subscribe((error) => {
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
      api.connect(clientId);
    } catch (error) {
      logger.error(error.message);
    }
  });

  afterEach(() => {
    if (api) {
      api.disconnect();
      api = undefined;
    }
  });

  it("Twice the same event callback bug", (done) => {
    // Two active subscriptions for the same Event issue #193
    subscription$ = api.getOpenOrders().subscribe({
      next: (_data) => {
        // console.log(data);
      },
      complete: () => {
        logger.info("getOpenOrders completed.");
        done();
      },
      error: (err: IBApiNextError) => {
        logger.error(`getOpenOrders failed with '${err.error.message}'`);
      },
    });

    api
      .getAllOpenOrders()
      .then((orders) => {
        logger.info(orders);
        subscription$.unsubscribe();
      })
      .catch((err: IBApiNextError) => {
        logger.error(`getAllOpenOrders failed with '${err}'`);
      });
  });
});
