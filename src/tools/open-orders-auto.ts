/**
 * This App will print real-time updates of the IBKR account open orders.
 */

import { Subscription } from "rxjs";

import { IBApiNextError } from "../";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Prints the account open orders.";
const USAGE_TEXT = "Usage: open-orders-updates.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [["bind", "auto bind orders"]];
const EXAMPLE_TEXT = "open-orders-updates.js";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class OpenOrdersApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /** The [[Subscription]] on the open orders. */
  private subscription$: Subscription;

  /**
   * Start the app.
   */
  start(): void {
    super.start();

    this.subscription$ = this.api
      .getAutoOpenOrders(this.cmdLineArgs.bind ? true : false)
      .subscribe({
        next: (data) => {
          this.printObject(data);
        },
        error: (err: IBApiNextError) => {
          this.error(`getOpenOrders failed with '${err.error.message}'`);
        },
        complete: () => {
          console.log("getOpenOrders completed.");
        },
      });
  }

  /**
   * Stop the app with success code.
   */
  stop() {
    console.log("app stopping.");
    this.subscription$?.unsubscribe();
    this.exit();
  }
}

// run the app

new OpenOrdersApp().start();
