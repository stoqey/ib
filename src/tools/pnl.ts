/**
 * This App will print daily PnL and unrealized PnL for a given account id.
 */
import path from "path";
import { Subscription } from "rxjs";

import { IBApiNextError } from "../api-next";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Print daily PnL and unrealized PnL for a given account id.";
const USAGE_TEXT = "Usage: pnl.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["account", "(required) The IBKR account id."],
  [
    "watch",
    "Watch for changes. If specified, the app will keep running and print PnL updates to console as received from TWS." +
      "If not specified, the app will print a one-time snapshot and than exit.",
  ],
];
const EXAMPLE_TEXT = "pnl.js -account=DU1234567 -watch";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintPositionsApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /** The [[Subscription]] on the PnL. */
  private subscription$: Subscription;

  /**
   * Start the the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.info(`Starting ${scriptName} script`);
    if (!this.cmdLineArgs.account) {
      this.error("-account argument missing.");
    }

    this.connect(this.cmdLineArgs.watch ? 10000 : 0);

    this.subscription$ = this.api
      .getPnL(this.cmdLineArgs.account, this.cmdLineArgs.model)
      .subscribe({
        next: (pnl) => {
          this.printObject(pnl);
          if (!this.cmdLineArgs.watch) {
            this.stop();
          }
        },
        error: (err: IBApiNextError) => {
          this.error(`getPnL failed with '${err.error.message}'`);
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
