/**
 * This App will print IBKR account place orders to console.
 */

import path from "path";

import { Contract, Order, OrderAction, OrderType, SecType } from "../";
import configuration from "../common/configuration";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Place new order.";
const USAGE_TEXT = "Usage: place-new-orders.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
const EXAMPLE_TEXT = "place-new-orders.js";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PlaceNewOrdersApp extends IBApiNextApp {
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

    const contract: Contract = {
      symbol: "AAPL",
      exchange: "SMART",
      currency: "USD",
      secType: SecType.STK,
    };

    const order: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: 120,
      totalQuantity: 10,
      account: configuration.ib_test_account,
      transmit: true,
    };
    this.api.placeNewOrder(contract, order);
    //setTimeout(process.exit(0), 3000);
  }

  /**
   * Stop the the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new PlaceNewOrdersApp().start();
