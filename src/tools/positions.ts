/**
 * This App will print all positions on your IBKR accounts to console.
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
  "Prints all positions on your IBKR accounts to console.";
const USAGE_TEXT = "Usage: positions.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  [
    "watch",
    "Watch for changes. If specified, the app will keep running and print positions updates to console as received from TWS." +
      "If not specified, the app will print a one-time snapshot and than exit.",
  ],
];
const EXAMPLE_TEXT = "positions.js -watch";

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
    this.connect(this.cmdLineArgs.watch ? 10000 : 0);
    this.subscription$ = this.api.getPositions().subscribe(
      (positions) => {
        this.printObject(positions);
        if (!this.cmdLineArgs.watch) {
          this.stop();
        }
      },
      (err: IBApiNextError) => {
        this.error(`getPositions failed with '${err.error.message}'`);
      }
    );
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
