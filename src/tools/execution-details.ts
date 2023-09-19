/**
 * This App will print IBKR account place new orders to console.
 */

import { ExecutionFilter } from "..";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Get close orders.";
const USAGE_TEXT = "Usage: close-order.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
const EXAMPLE_TEXT = "close-order.js -clientId=0";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class CloseOrdersApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }
  /**
   * Start the app.
   */
  start(): void {
    super.start();

    const executionFilter: ExecutionFilter = {
      clientId: "0",
    };
    this.api.getExecutionDetails(executionFilter).then(
      (closedOrders) => {
        this.printObject(closedOrders);
        this.exit();
      },
      (error) => {
        this.printObject(error);
      },
    );
  }

  /**
   * Stop the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new CloseOrdersApp().start();
