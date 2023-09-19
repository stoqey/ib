/**
 * This App will print real time market data of a given contract id.
 */

import { Subscription } from "rxjs";

import { IBApiNextError, IBApiNextTickType, IBApiTickType } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Print real time market data of a given contract id.";
const USAGE_TEXT = "Usage: market-data.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ...IBApiNextApp.DEFAULT_CONTRACT_OPTIONS,
  ["ticks=<ticks>", "Comma separated list of generic ticks to fetch."],
];
const EXAMPLE_TEXT =
  "market-data.js -symbol=AMZN -sectype=STK -exchange=SMART -conid=3691937";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintMarketDataApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /** The [[Subscription]] on the MarketData. */
  private subscription$: Subscription;

  /**
   * Start the app.
   */
  start(): void {
    super.start();

    this.subscription$ = this.api
      .getMarketData(
        this.getContractArg(),
        this.cmdLineArgs.ticks as string,
        false,
        false,
      )
      .subscribe({
        next: (marketData) => {
          const changedOrAddedDataWithTickNames = new Map<string, number>();
          marketData.added?.forEach((tick, type) => {
            if (type > IBApiNextTickType.API_NEXT_FIRST_TICK_ID) {
              changedOrAddedDataWithTickNames.set(
                IBApiNextTickType[type],
                tick.value,
              );
            } else {
              changedOrAddedDataWithTickNames.set(
                IBApiTickType[type],
                tick.value,
              );
            }
          });
          marketData.changed?.forEach((tick, type) => {
            if (type > IBApiNextTickType.API_NEXT_FIRST_TICK_ID) {
              changedOrAddedDataWithTickNames.set(
                IBApiNextTickType[type],
                tick.value,
              );
            } else {
              changedOrAddedDataWithTickNames.set(
                IBApiTickType[type],
                tick.value,
              );
            }
          });
          this.printObject(changedOrAddedDataWithTickNames);
        },
        error: (err: IBApiNextError) => {
          this.subscription$?.unsubscribe();
          this.error(
            `getMarketData failed with '${err.error.message}' (${err.code})`,
          );
        },
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

new PrintMarketDataApp().start();
