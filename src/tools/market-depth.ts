/**
 * This App will print a contract's market depth (order book).
 */

import path from "path";
import { Subscription } from "rxjs";

import { IBApiNextError } from "../api-next";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// Help text and command line parsing                                          //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Prints a contract's market depth (order book).";
const USAGE_TEXT = "Usage: market-depth.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["conid=<number>", "Contract ID (conId) of the contract."],
  ["exchange=<name>", "The destination exchange name."],
  ["rows=<number>", "The number of rows on each side of the order book."],
  [
    "smart=<0/1>",
    "Enable/Disable smart depth request (aggregate from multiple exchanges). Default is 1 (smart)",
  ],
];
const EXAMPLE_TEXT =
  "market-depth-depth.js -conid=385666824 -exchange=NYSELIFFE -rows=200 -smart=0 -port=4002";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintMarketDepthExchangesApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /** The [[Subscription]] on the PnLSingle. */
  private subscription$: Subscription;

  /**
   * Start the the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.debug(`Starting ${scriptName} script`);
    this.connect(0);

    if (!this.cmdLineArgs.conid) {
      this.error("-conid argument missing.");
    }
    if (!this.cmdLineArgs.exchange) {
      this.error("-exchange argument missing.");
    }

    // print order book updates

    this.subscription$ = this.api
      .getMarketDepth(
        {
          conId: this.cmdLineArgs.conid as number,
          exchange: this.cmdLineArgs.exchange as string,
        },
        this.cmdLineArgs.rows !== undefined
          ? (this.cmdLineArgs.rows as number)
          : 100,
        this.cmdLineArgs.smart !== undefined
          ? this.cmdLineArgs.smart === "1"
          : true
      )
      .subscribe({
        next: (orderBookUpdate) => {
          this.printObject(orderBookUpdate);
        },
        error: (err: IBApiNextError) => {
          this.subscription$?.unsubscribe();
          this.error(`getMarketData failed with '${err.error.message}'`);
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

new PrintMarketDepthExchangesApp().start();
