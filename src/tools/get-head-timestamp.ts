/**
 * This App will print the timestamp of earliest available historical data for a contract.
 */

import { IBApiNextError } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// Help text and command line parsing                                          //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Prints the timestamp of earliest available historical data for a contract.";
const USAGE_TEXT = "Usage: get-head-timestamp.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ...IBApiNextApp.DEFAULT_CONTRACT_OPTIONS,
];
const EXAMPLE_TEXT =
  "get-head-timestamp.js -symbol=AMZN -sectype=STK -currency=USD -exchange=SMART -conid=3691937 -port=4002";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintHeadTimestampApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /**
   * Start the app.
   */
  start(): void {
    super.start();

    // print next unused order id
    this.api
      .getHeadTimestamp(this.getContractArg(), "TRADES", true, 1)
      .then((timestamp) => {
        this.printText(timestamp);
        this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getHeadTimestamp failed with '${err.error.message}'`);
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
new PrintHeadTimestampApp().start();
