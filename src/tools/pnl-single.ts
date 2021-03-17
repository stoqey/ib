/**
 * This App will print real time updates for daily PnL of individual positions.
 */
import path from "path";
import { Subscription } from "rxjs";

import { IBApiNextError } from "../api-next";
import logger from "../utils/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text                                                               //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT =
  "Print real time updates for daily PnL of individual positions..";
const USAGE_TEXT = "Usage: pnl-single.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["account=<account_id>", "(required) Account in which position exists."],
  [
    "conid=<number>",
    "(required) Contract ID (conId) of contract to receive daily PnL updates for.",
  ],
  ["model=<code>", "Model in which position exists."],
  [
    "watch",
    "Watch for changes. If specified, the app will keep running and print PnL updates to console as received from TWS." +
      "If not specified, the app will print a one-time snapshot and than exit.",
  ],
];
const EXAMPLE_TEXT = "pnl-single.js -account=DU1234567 -conid=1234567 -watch";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PrintPositionsApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /** The [[Subscription]] on the PnLSingle. */
  private subscription$: Subscription;

  /**
   * Start the the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.debug(`Starting ${scriptName} script`);
    if (!this.cmdLineArgs.account) {
      this.error("-account argument missing.");
    }
    if (!this.cmdLineArgs.conid) {
      this.error("-conid argument missing.");
    }
    this.connect(this.cmdLineArgs.watch ? 10000 : 0);
    this.subscription$ = this.api
      .getPnLSingle(
        this.cmdLineArgs.account,
        this.cmdLineArgs.model,
        Number(this.cmdLineArgs.conid)
      )
      .subscribe(
        (pnlSingle) => {
          this.printObject(pnlSingle);
          if (!this.cmdLineArgs.watch) {
            this.stop();
          }
        },
        (err: IBApiNextError) => {
          this.error(`getPnLSingle failed with '${err.error.message}'`);
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

new PrintPositionsApp().start();
