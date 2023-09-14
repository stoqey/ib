/**
 * This App will print real time updates for daily PnL of individual positions.
 */
import path from "path";
import { Subscription } from "rxjs";

import { IBApiNextError } from "../api-next";
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
   * Start the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    this.info(`Starting ${scriptName} script`);
    this.connect();

    if (!this.cmdLineArgs.account) {
      this.error("-account argument missing.");
    }
    if (!this.cmdLineArgs.conid) {
      this.error("-conid argument missing.");
    }

    this.subscription$ = this.api
      .getPnLSingle(
        this.cmdLineArgs.account as string,
        this.cmdLineArgs.model as string,
        this.cmdLineArgs.conid as number,
      )
      .subscribe({
        next: (pnlSingle) => {
          this.printObject(pnlSingle);
          if (!this.cmdLineArgs.watch) {
            this.stop();
          }
        },
        error: (err: IBApiNextError) => {
          this.error(`getPnLSingle failed with '${err.error.message}'`);
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

new PrintPositionsApp().start();
