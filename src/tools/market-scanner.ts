/**
 * This App will print histogram data of a contract.
 */
import path from "path";
import { Subscription } from "rxjs";

import { IBApiNextError } from "../api-next";
import DurationUnit from "../api/data/enum/duration-unit";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Print Most active stocks scan.";
const USAGE_TEXT = "Usage: market-scanner.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  [
    "conid=<number>",
    "(required) Contract ID (conId) of contract to receive histogram data for.",
  ],
  ["exchange=<name>", "The destination exchange name."],
  ["period=<seconds>", "(required) Period of which data is being requested"],
  [
    "periodUnit=<SECOND|DAY|WEEK|MONTH|YEAR>",
    "(required) Unit of the period argument",
  ],
];
const EXAMPLE_TEXT =
  "market-scanner.js -conid=3691937 -exchange=SMART -period=3 -periodUnit=DAY";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintMarketScreenerApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  private subscription$: Subscription;

  /**
   * Start the app.
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
    if (!this.cmdLineArgs.period) {
      this.error("-period argument missing.");
    }
    if (!this.cmdLineArgs.periodUnit) {
      this.error("-periodUnit argument missing.");
    }
    if (!(this.cmdLineArgs.periodUnit in DurationUnit)) {
      this.error(
        "Invalid -periodUnit argument value: " + this.cmdLineArgs.periodUnit
      );
    }

    this.connect(this.cmdLineArgs.watch ? 10000 : 0);

    this.subscription$ = this.api
      .getMarketScanner({
        abovePrice: 1,
        scanCode: "MOST_ACTIVE",
      })
      .subscribe((data) => {
        this.printObject(`getHistogramData: ${JSON.stringify(data)}`);
      }, this.error.bind(this));
  }

  /**
   * Stop the app with success code.
   */
  stop() {
    this.subscription$?.unsubscribe();
    this.exit();
  }
}

// run the app

new PrintMarketScreenerApp().start();
