/**
 * This App will print historical last trade price Time&Sales data of and instrument.
 */
import path from "path";
import { Subscription } from "rxjs";
import { HistoricalTickLast } from "..";

import { IBApiNextError } from "../api-next";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Print historical last trade price Time&Sales data of and instrument.";
const USAGE_TEXT = "Usage: historical-ticks-mid.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  [
    "conid=<number>",
    "(required) Contract ID (conId) of contract to receive historical last trade price Time&Sales data for.",
  ],
  ["exchange=<name>", "The destination exchange name."],
  [
    "start=<dateTimeString>",
    "(required if -end not specified) The start date/time of the request. '20170701 12:01:00'. Uses TWS timezone specified at login.",
  ],
  [
    "end=<dateTimeString>",
    "(required if -start not specified) The end date/time of the request. '20170701 13:01:00'. In TWS timezone.",
  ],
  [
    "count=<number>",
    "(required) Number of distinct data points. Max 1000 per request.",
  ],
  [
    "rth=<0/1>",
    "(optional) Data from regular trading hours (1), or all available hours (0). Default is 1",
  ],
];
const EXAMPLE_TEXT =
  "historical-ticks-mid.js -conid=3691937 -exchange=SMART -start=20210604 16:00:00 -count=100";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintHistoricalTicksMidApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /** The [[Subscription]] on the historic ticks while being collected from TWS (list will grow incrementally). */
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
    if (!this.cmdLineArgs.start && !this.cmdLineArgs.end) {
      this.error("-start or -end argument missing.");
    }
    if (this.cmdLineArgs.start && this.cmdLineArgs.end) {
      this.error("-start and -end argument specified, only use one of both.");
    }
    if (!this.cmdLineArgs.count) {
      this.error("-count argument missing.");
    }

    this.connect();

    let allTicks: HistoricalTickLast[];

    this.subscription$ = this.api
      .getHistoricalTicksLast(
        {
          conId: Number(this.cmdLineArgs.conid),
          exchange: this.cmdLineArgs.exchange,
        },
        this.cmdLineArgs.start,
        this.cmdLineArgs.end,
        Number(this.cmdLineArgs.count),
        Number(this.cmdLineArgs.rth === undefined ? 1 : this.cmdLineArgs.rth)
      )
      .subscribe({
        next: (ticks) => {
          // this called each time a new tick arrives (e.g. to show a progress indicator,
          // or to display results incrementally - we don't, but simply wait for complete)
          allTicks = ticks;
        },
        complete: () => {
          this.printObject(allTicks);
          this.stop();
        },
        error: (err: IBApiNextError) => {
          this.error(
            `getHistoricalTicksBidAsk failed with '${err.error.message}'`
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

new PrintHistoricalTicksMidApp().start();
