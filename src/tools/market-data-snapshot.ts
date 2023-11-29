/**
 * This App will print real time market data of a given contract id.
 */

import { Subscription } from "rxjs";

import { IBApiNextError, IBApiNextTickType, IBApiTickType } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Print snapshot of real time market data of a given contract id.";
const USAGE_TEXT = "Usage: market-data-snapshot.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ...IBApiNextApp.DEFAULT_CONTRACT_OPTIONS,
  // Snapshot market data subscription is not applicable to generic ticks (Error #321)
  // ["ticks=<ticks>", "Comma separated list of generic ticks to fetch."],
];
const EXAMPLE_TEXT =
  "market-data-snapshot.js -symbol=AAPL -conid=265598 -sectype=STK -exchange=SMART";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintMarketDataSingleApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /** The [[Subscription]] */
  private subscription$: Subscription;

  /**
   * Start the app.
   */
  start(): void {
    super.start();

    this.api
      .getMarketDataSnapshot(this.getContractArg(), "", false)
      .then((marketData) => {
        const dataWithTickNames = new Map<string, number>();
        marketData.forEach((tick, type) => {
          if (type > IBApiNextTickType.API_NEXT_FIRST_TICK_ID) {
            dataWithTickNames.set(IBApiNextTickType[type], tick.value);
          } else {
            dataWithTickNames.set(IBApiTickType[type], tick.value);
          }
        });
        this.printObject(dataWithTickNames);
        if (!this.cmdLineArgs.watch) this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getMarketDataSingle failed with '${err.error.message}'`);
      });
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

new PrintMarketDataSingleApp().start();
