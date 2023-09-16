/**
 * This App will request contract details from TWS and print it to console.
 */

import { IBApiNextError } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Requests contract details from TWS and prints it to console.";
const USAGE_TEXT = "Usage: contract-details.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ...IBApiNextApp.DEFAULT_CONTRACT_OPTIONS,
];
const EXAMPLE_TEXT =
  "contract-details.ts -symbol=AMZN -sectype=STK -currency=USD";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintContractDetailsApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /**
   * Start the app.
   */
  start(): void {
    super.start();

    this.api
      .getContractDetails(this.getContractArg())
      .then((details) => {
        this.printObject(details);
        this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getContractDetails failed with '${err.error.message}'`);
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

new PrintContractDetailsApp().start();
