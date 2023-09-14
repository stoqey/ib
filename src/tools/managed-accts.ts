/**
 * This App will print the accounts to which the logged user has access to.
 */

import path from "path";

import { IBApiNextError } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Prints the accounts to which the logged user has access to.";
const USAGE_TEXT = "Usage: managed-accts.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
const EXAMPLE_TEXT = "managed-accts.js -port=4002";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintManagedAcctsApp extends IBApiNextApp {
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

    this.api
      .getManagedAccounts()
      .then((accounts) => {
        this.printObject(accounts);
        this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getManagedAccounts failed with '${err.error.message}'`);
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

new PrintManagedAcctsApp().start();
