/**
 * This App will print the timestamp of earliest available historical data for a contract.
 */

import path from "path";
import { OptionType, SecType } from "..";

import { IBApiNextError } from "../api-next";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// Help text and command line parsing                                          //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Prints the timestamp of earliest available historical data for a contract.";
const USAGE_TEXT = "Usage: get-head-timestamp.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["conid=<number>", "Contract ID (conId) of the contract."],
  ["symbol=<name>", "The symbol name."],
  [
    "sectype=<type>",
    "The security type. Valid values: STK, OPT, FUT, IND, FOP, CFD, CASH, BAG, BOND, CMDTY, NEWS and FUND",
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
  "get-head-timestamp.js -symbol=AMZN -sectype=STK -currency=USD -port=4002";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintHeadTimestampApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /**
   * Start the the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.debug(`Starting ${scriptName} script`);
    this.connect(0);

    // print next unused order id

    this.api
      .getHeadTimestamp(
        {
          symbol: this.cmdLineArgs.symbol as string,
          conId: (this.cmdLineArgs.conid as number) ?? undefined,
          secType: this.cmdLineArgs.sectype as SecType,
          exchange: this.cmdLineArgs.exchange as string,
          currency: this.cmdLineArgs.currency as string,
          lastTradeDateOrContractMonth: this.cmdLineArgs.expiry as string,
          strike: (this.cmdLineArgs.strike as number) ?? undefined,
          right: this.cmdLineArgs.right as OptionType,
        },
        "TRADES",
        true,
        1
      )
      .then((timestamp) => {
        this.printText(timestamp);
        this.exit();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getHeadTimestamp failed with '${err.error.message}'`);
      });
  }
}

// run the app

new PrintHeadTimestampApp().start();
