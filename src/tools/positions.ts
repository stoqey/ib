/**
 * This App will print all positions on your IBKR accounts to console.
 */

import { Subscription } from "rxjs";

import { IBApiNextError } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Prints all positions on your IBKR accounts to console.";
const USAGE_TEXT = "Usage: positions.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
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
   * Start the app.
   */
  start(): void {
    super.start();

    this.subscription$ = this.api.getPositions().subscribe({
      next: (positions) => {
        this.printObject(positions);
        if (!this.cmdLineArgs.watch) {
          this.stop();
        }
      },
      error: (err: IBApiNextError) => {
        this.error(`getPositions failed with '${err.error.message}'`);
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

new PrintPositionsApp().start();
