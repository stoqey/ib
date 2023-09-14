/**
 * This App will print IBKR account place new orders to console.
 */
import path from "path";

import { ExecutionFilter } from "..";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Get commission report.";
const USAGE_TEXT = "Usage: commission-reports.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
const EXAMPLE_TEXT = "commission-reports.js  -clientId=0";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class CommissionReportApp extends IBApiNextApp {
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

    const executionFilter: ExecutionFilter = {
      clientId: "0",
    };
    this.api.getCommissionReport(executionFilter).then(
      (commissionReports) => {
        this.printObject(commissionReports);
        this.exit();
      },
      (error) => {
        this.printObject(error);
      },
    );
  }

  /**
   * Stop the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new CommissionReportApp().start();
