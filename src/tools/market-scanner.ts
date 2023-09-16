/**
 * This App will print Most active stocks.
 */
import { Subscription } from "rxjs";

import { IBApiNextError } from "../api-next";
import {
  Instrument,
  LocationCode,
  ScanCode,
} from "../api-next/market-scanner/market-scanner";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Print most active stocks scan.";
const USAGE_TEXT = "Usage: market-scanner.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
const EXAMPLE_TEXT =
  "market-scanner.js -conid=3691937 -exchange=SMART -period=3 -periodUnit=DAY";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintMarketScreenerApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  private subscription$: Subscription;

  /**
   * Start the app.
   */
  start(): void {
    super.start();

    this.subscription$ = this.api
      .getMarketScanner({
        abovePrice: 1,
        scanCode: ScanCode.MOST_ACTIVE,
        locationCode: LocationCode.STK_US,
        instrument: Instrument.STK,
        numberOfRows: 20,
      })
      .subscribe({
        next: (data) => {
          this.printObject(data.all);
          if (!this.cmdLineArgs.watch) this.stop();
        },
        error: (error: IBApiNextError) => {
          logger.error("Error from the subscriber", error);
          this.stop();
        },
      });
  }
  /**
   * Stop the app with success code.
   */
  stop() {
    this.subscription$?.unsubscribe();
    this.exit();
  }
}

// run the app

new PrintMarketScreenerApp().start();
