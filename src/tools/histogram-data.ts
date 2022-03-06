/**
 * This App will print histogram data of a contract.
 */
import path from "path";

import { IBApiNextError } from "../api-next";
import DurationUnit from "../api/data/enum/duration-unit";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Print histogram data of a contract.";
const USAGE_TEXT = "Usage: histogram-data.js <options>";
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
  "histogram-data.js -conid=3691937 -exchange=SMART -period=3 -periodUnit=DAY";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintHistogramDataApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

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

    this.connect();

    this.api
      .getHistogramData(
        {
          conId: this.cmdLineArgs.conid as number,
          exchange: this.cmdLineArgs.exchange as string,
        },
        false,
        this.cmdLineArgs.period as number,
        this.cmdLineArgs.periodUnit as DurationUnit
      )
      .then((data) => {
        this.printObject(data);
        this.exit();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getHistogramData failed with '${err.error.message}'`);
      });
  }
}

// run the app

new PrintHistogramDataApp().start();
