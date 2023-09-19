/**
 * This App will print the venues for which market data is returned on getMarketDepthL2 (those with market makers)
 */

import { IBApiNextError } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// Help text and command line parsing                                          //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Prints the venues for which market data is returned on getMarketDepthL2 (those with market makers).";
const USAGE_TEXT = "Usage: market-depth-exchanges.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
const EXAMPLE_TEXT = "market-depth-exchanges.js -host=localhost -port=4002";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintMarketDepthExchangesApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /**
   * Start the app.
   */
  start(): void {
    super.start();

    // print current time

    this.api
      .getMarketDepthExchanges()
      .then((data) => {
        this.printObject(data);
        this.exit();
      })
      .catch((err: IBApiNextError) => {
        this.error(
          `getMarketDepthExchanges failed with '${err.error.message}'`,
        );
      });
  }
}

// run the app

new PrintMarketDepthExchangesApp().start();
