/**
 * This App will print IBKR account open orders to console.
 */

import { IBApiNextError } from "../";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Prints the account open orders.";
const USAGE_TEXT = "Usage: open-orders.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
const EXAMPLE_TEXT = "open-orders.js";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class OpenOrdersApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /**
   * Start the app.
   */
  start(): void {
    super.start();

    this.api
      .getAllOpenOrders()
      .then((orders) => {
        this.printObject(orders);
        this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getAllOpenOrders failed with '${err}'`);
      });
  }

  /**
   * Stop the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new OpenOrdersApp().start();
