/**
 * This App will print IBKR account place new orders to console.
 */
import path from "path";

import { ExecutionFilter } from "../";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Place new order.";
const USAGE_TEXT = "Usage: place-new-orders.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["price=<number>", "price of an order."],
  ["symbol=<name>", "The symbol name."],
  ["quantity=<number>", "Quantity of an order."],
  ["clientId=<number>", "Client id of current ib connection. Default is 0"],
];
const EXAMPLE_TEXT =
  "place-new-orders.js -price=120 -symbol=AMZN -quantity=10 -clientId=0";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class CloseOrdersApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }
  /**
   * Start the the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.debug(`Starting ${scriptName} script`);

    this.connect(this.cmdLineArgs.watch ? 10000 : 0);

    const executionFilter: ExecutionFilter = {
      clientId: "0",
    };
    this.api.getExecutionDetails(executionFilter).then(
      (closedOrders) => {
        this.printObject(closedOrders);
        this.exit();
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Stop the the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new CloseOrdersApp().start();
