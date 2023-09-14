/**
 * This App will print the next valid unused order id.
 */

import path from "path";

import { IBApiNextError } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// Help text and command line parsing                                          //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Prints the next valid unused order id.";
const USAGE_TEXT = "Usage: next-valid-order-id.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
const EXAMPLE_TEXT = "next-valid-order-id.js -host=localhost -port=4002";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintNextUnusedOrderIdApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /**
   * Start the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    this.info(`Starting ${scriptName} script`);
    this.connect();

    // print next unused order id

    this.api
      .getNextValidOrderId()
      .then((id) => {
        this.printText(`${id}`);
        this.exit();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getNextValidOrderId failed with '${err.error.message}'`);
      });
  }
}

// run the app

new PrintNextUnusedOrderIdApp().start();
