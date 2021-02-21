/**
 * This App will print all positions on your IBKR accounts to console.
 */

import { IBApiError } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";
import { Subscription } from "rxjs";

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
  [
    "inc",
    "Print incremental updates only. When not specified and -watch is used, an update of a position value will print all positions again." +
      "If the specified, only the changed position(s) will be printed",
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
    this.connect(this.cmdLineArgs.watch ? 10000 : 0);
    this.subscription$ = this.api
      .getPositions(this.cmdLineArgs.inc ? true : false)
      .subscribe(
        (positions) => {
          this.printObject(positions);
          if (!this.cmdLineArgs.watch) {
            this.stop();
          }
        },
        (err: IBApiError) => {
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
