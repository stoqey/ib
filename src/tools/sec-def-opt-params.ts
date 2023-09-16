/**
 * This App will request security definition option parameters from TWS and print it to console.
 */

import { SecType } from "../";
import { IBApiNextError } from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Requests security definition option parameters from TWS and prints it to console.";
const USAGE_TEXT = "Usage: sec-def-opt-params <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["conid=<number>", "Contract ID (conId) of the underlying contract."],
  ["symbol=<name>", "The underlying symbol name."],
  ["sectype=<type>", "The underlying security type. Valid values: STK or IND"],
  [
    "exchange=<name>",
    "The exchange on which the returned options are trading.",
  ],
];
const EXAMPLE_TEXT =
  "sec-def-opt-params -symbol=AAPL -sectype=STK -conid=265598";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintOptionsDetailsApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /**
   * Start the app.
   */
  start(): void {
    super.start();

    this.api
      .getSecDefOptParams(
        this.cmdLineArgs.symbol as string,
        this.cmdLineArgs.exchange as string,
        this.cmdLineArgs.sectype as SecType,
        (this.cmdLineArgs.conid as number) ?? undefined,
      )
      .then((details) => {
        this.printObject(details);
        this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getSecDefOptParams failed with '${err.error.message}'`);
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

new PrintOptionsDetailsApp().start();
