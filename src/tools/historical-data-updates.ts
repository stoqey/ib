/**
 * This App will print real-time updates of the latest historical data bar of a contract.
 */
import path from "path";
import { Subscription } from "rxjs";

import { IBApiNextError } from "../api-next";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Print historical chart data of a contract.";
const USAGE_TEXT = "Usage: historical-data.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  [
    "conid=<number>",
    "(required) Contract ID (conId) of contract to receive real-time bar updates for.",
  ],
  ["exchange=<name>", "The destination exchange name."],
  ["barSize=<durationString>", "(required) The data granularity."],
];
const EXAMPLE_TEXT =
  "historical-data-updates.js -conid=3691937 -exchange=SMART -barSize=15 mins";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintPositionsApp extends IBApiNextApp {
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

    if (!this.cmdLineArgs.conid) {
      this.error("-conid argument missing.");
    }
    if (!this.cmdLineArgs.exchange) {
      this.error("-exchange argument missing.");
    }
    if (!this.cmdLineArgs.barSize) {
      this.error("-barSize argument missing.");
    }

    this.connect(10000);

    this.subscription$ = this.api
      .getHistoricalDataUpdates(
        {
          conId: this.cmdLineArgs.conid as number,
          exchange: this.cmdLineArgs.exchange as string,
        },
        this.cmdLineArgs.barSize as string,
        "MIDPOINT",
        1
      )
      .subscribe({
        next: (bar) => {
          this.printObject(bar);
        },
        error: (err: IBApiNextError) => {
          this.error(
            `getHistoricalDataUpdates failed with '${err.error.message}'`
          );
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

new PrintPositionsApp().start();
