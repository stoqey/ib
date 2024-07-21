import { Subscription } from "rxjs";
import { IBApiNext, IBApiNextError } from "../../..";

describe("Subscription registry Tests", () => {
  jest.setTimeout(20000);

  const clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  let subscription$: Subscription;
  let api: IBApiNext;
  let error$: Subscription;

  beforeEach(() => {
    api = new IBApiNext();

    if (!error$) {
      error$ = api.errorSubject.subscribe((error) => {
        if (error.reqId === -1) {
          console.warn(`${error.error.message} (Error #${error.code})`);
        } else {
          console.error(
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
      console.error(error.message);
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
      next: (data) => {
        // console.log(data);
      },
      complete: () => {
        console.log("getOpenOrders completed.");
        done();
      },
      error: (err: IBApiNextError) => {
        console.error(`getOpenOrders failed with '${err.error.message}'`);
      },
    });

    api
      .getAllOpenOrders()
      .then((orders) => {
        console.log(orders);
        subscription$.unsubscribe();
      })
      .catch((err: IBApiNextError) => {
        console.error(`getAllOpenOrders failed with '${err}'`);
      });
  });
});
