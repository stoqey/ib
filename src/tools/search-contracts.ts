/**
 * This App will search contracts matching a given text pattern and print it
 * to console.
 */

import path from "path";
import { IBApiNextError } from "../api-next";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

///////////////////////////////////////////////////////////////////////////////
// The help text                                                             //
///////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Search contracts matching a given text pattern.";
const USAGE_TEXT = "Usage: search-contract.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["pattern=<text>", "The name or symbol to search."],
];
const EXAMPLE_TEXT = "search-contract.ts -text=Apple";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintContractSearchApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /**
   * Start the the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.debug(`Starting ${scriptName} script`);
    if (!this.cmdLineArgs.pattern) {
      this.error("-pattern argument missing.");
    }

    this.connect();

    this.api
      .searchContracts(this.cmdLineArgs.pattern as string)
      .then((searchResult) => {
        this.printObject(searchResult);
        this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`searchContracts failed with '${err.error.message}'`);
      });
  }

  /**
   * Stop the the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new PrintContractSearchApp().start();
