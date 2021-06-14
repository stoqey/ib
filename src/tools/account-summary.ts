/**
 * This App will print IBKR account summaries to console.
 */

import path from "path";
import { Subscription } from "rxjs";

import { IBApiNextError } from "../api-next";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// Default options values.                                                     //
/////////////////////////////////////////////////////////////////////////////////

/** Default group if no -group argument is on command line. */
const DEFAULT_GROUP = "All";

/** Default tags if no -tags argument is on command line. */
const DEFAULT_TAGS = "NetLiquidation,TotalCashValue,GrossPositionValue";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Prints the account summaries.";
const USAGE_TEXT = "Usage: account-summary.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  [
    "group=<name>",
    `Advisor Account Group name. Default is '${DEFAULT_GROUP}'.`,
  ],
  [
    "tags=<tag list>",
    `A comma separated list with the desired tags. Default is '${DEFAULT_TAGS}'`,
  ],
  [
    "watch",
    "Watch for changes. If specified, the app will keep running and print account summary updates to console as received from TWS." +
      "If not specified, the app will print a one-time snapshot and than exit.",
  ],
];
const EXAMPLE_TEXT =
  "account-summary.js -group=All -tags=NetLiquidation,MaintMarginReq -watch";

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
    this.subscription$ = this.api
      .getAccountSummary(
        this.cmdLineArgs.group as string ?? DEFAULT_GROUP,
        this.cmdLineArgs.tags as string ?? DEFAULT_TAGS
      )
      .subscribe({
        next: (summaries) => {
          this.printObject(summaries);
          if (!this.cmdLineArgs.watch) {
            this.stop();
          }
        },
        error: (err: IBApiNextError) => {
          this.error(`getAccountSummary failed with '${err.error.message}'`);
        },
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
