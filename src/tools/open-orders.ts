/**
 * This App will print IBKR account open orders to console.
 */

import path from "path";
import { Subscription } from "rxjs";

import { IBApiNextError } from "../";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// Default options values.                                                     //
/////////////////////////////////////////////////////////////////////////////////

// /** Default group if no -group argument is on command line. */
// const DEFAULT_GROUP = "All";

// /** Default tags if no -tags argument is on command line. */
// const DEFAULT_TAGS = "NetLiquidation,TotalCashValue,GrossPositionValue";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Prints the account open orders.";
const USAGE_TEXT = "Usage: open-orders.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  [
    "watch",
    "Watch for changes. If specified, the app will keep running and print account summary updates to console as received from TWS." +
      "If not specified, the app will print a one-time snapshot and than exit.",
  ],
];
const EXAMPLE_TEXT =
  "open-orders.js -group=All -tags=NetLiquidation,MaintMarginReq -watch";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintAccountSummaryApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /** The [[Subscription]] on the account summary. */
  private subscription$: Subscription;

  /**
   * Start the the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.debug(`Starting ${scriptName} script`);

    this.connect(this.cmdLineArgs.watch ? 10000 : 0);
     this.api
       .getAllOpenOrders().then(orders => {
         this.printObject(orders);
         this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getAllOpenOrders failed with '${err.error.message}'`);
      });
  }

  /**
   * Stop the the app with success code.
   */
  stop() {
    this.subscription$?.unsubscribe();
    this.exit();
  }
}

// run the app

new PrintAccountSummaryApp().start();
