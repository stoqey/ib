/**
 * This App will request contract details from TWS and print it to console.
 */

import path from "path";

import { OptionType, SecType } from "../";
import { IBApiNextError } from "../api-next";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Requests contract details from TWS and prints it to console.";
const USAGE_TEXT = "Usage: contract-details.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["conid=<number>", "Contract ID (conId) of the contract."],
  ["symbol=<name>", "The symbol name."],
  [
    "sectype=<type>",
    "The security type. Valid values: STK, OPT, FUT, IND, FOP, CFD, CASH, BAG, BOND, CMDTY, NEWS, FUND and CRYPTO.",
  ],
  ["exchange=<name>", "The destination exchange name."],
  ["currency=<currency>", "The contract currency."],
  [
    "expiry=<YYYYMM>",
    "The contract's last trading day or contract month (for Options and Futures)." +
      "Strings with format YYYYMM will be interpreted as the Contract Month whereas YYYYMMDD will be interpreted as Last Trading Day.",
  ],
  ["strike=<number>", "The option's strike price."],
  ["right=<P|C>", " The option type. Valid values are P, PUT, C, CALL."],
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
   * Start the the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.debug(`Starting ${scriptName} script`);
    this.connect();

    this.api
      .getContractDetails({
        symbol: this.cmdLineArgs.symbol as string,
        conId: (this.cmdLineArgs.conid as number) ?? undefined,
        secType: this.cmdLineArgs.sectype as SecType,
        exchange: this.cmdLineArgs.exchange as string,
        currency: this.cmdLineArgs.currency as string,
        lastTradeDateOrContractMonth: this.cmdLineArgs.expiry as string,
        strike: (this.cmdLineArgs.strike as number) ?? undefined,
        right: this.cmdLineArgs.right as OptionType,
      })
      .then((details) => {
        this.printObject(details);
        this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getContractDetails failed with '${err.error.message}'`);
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

new PrintContractDetailsApp().start();
