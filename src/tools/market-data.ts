/**
 * This App will print real time market data of a given contract id.
 */

import {
  IBApiError,
  IBApiNextTickType,
  IBApiTickType,
  MarketDataType,
} from "../api-next";
import { IBApiNextApp } from "./common/ib-api-next-app";
import { Subscription } from "rxjs";
import { SecType } from "..";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Print real time market data of a given contract id.";
const USAGE_TEXT = "Usage: market-data.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["conid=<number>", "Contract ID (conId) of the contract."],
  ["symbol=<name>", "The symbol name."],
  [
    "sectype=<type>",
    "The security type. Valid values: STK, OPT, FUT, IND, FOP, CFD, CASH, BAG, BOND, CMDTY, NEWS and FUND",
  ],
  ["exchange=<name>", "The destination exchange name."],
  ["currency=<currency>", "The contract currency."],
];
const EXAMPLE_TEXT = "pnl-single.js -account=DU1234567 -watch";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintMarketDataApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /** The [[Subscription]] on the PnLSingle. */
  private subscription$: Subscription;

  /**
   * Start the the app.
   */
  start(): void {
    this.connect(this.cmdLineArgs.watch ? 10000 : 0);
    this.api.setMarketDataType(MarketDataType.FROZEN);
    this.subscription$ = this.api
      .getMarketData(
        {
          conId: this.cmdLineArgs.conid
            ? Number(this.cmdLineArgs.conid)
            : undefined,
          symbol: this.cmdLineArgs.symbol,
          secType: this.cmdLineArgs.sectype as SecType,
          exchange: this.cmdLineArgs.exchange,
          currency: this.cmdLineArgs.currency,
        },
        "",
        false,
        false
      )
      .subscribe(
        (marketData) => {
          const marketDataWithTickNames = new Map<string, number>();
          marketData.forEach((value, type) => {
            if (type > IBApiNextTickType.API_NEXT_FIRST_TICK_ID) {
              marketDataWithTickNames.set(IBApiNextTickType[type], value);
            } else {
              marketDataWithTickNames.set(IBApiTickType[type], value);
            }
          });
          this.printObject(marketDataWithTickNames);
        },
        (err: IBApiError) => {
          this.error(`getMarketData failed with '${err.error.message}'`);
        }
      );
  }

  /**
   * Stop the the app with success code.
   */
  stop() {
    this.subscription$?.unsubscribe();
    this.exit();
  }
}

// run the app

new PrintMarketDataApp().start();
