/**
 * This App will print IBKR account modify orders to console.
 */

import path from "path";

import { Contract, Order, OrderAction, OrderType, SecType } from "../";
import configuration from "../common/configuration";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Modify order.";
const USAGE_TEXT = "Usage: modify-orders.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["price=<number>", "price of an order."],
  ["quantity=<number>", "Quantity of an order."],
  ["clientId=<number>", "Client id of current ib connection. Default is 0"],
];
const EXAMPLE_TEXT =
  "modify-orders.js -price=120 -quantity=10 -clientId=0 -orderId=2";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class ModifyOrdersApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }
  /**
   * Start the the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.debug(`Starting ${scriptName} script`);

    this.connect(
      this.cmdLineArgs.watch ? 10000 : 0,
      +this.cmdLineArgs.clientId ?? 0
    );

    const id = 8;

    const contract: Contract = {
      symbol: "AAPL",
      exchange: "SMART",
      currency: "USD",
      secType: SecType.STK,
    };

    const order: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: +this.cmdLineArgs.price,
      orderId: id,
      totalQuantity: +this.cmdLineArgs.quantity,
      account: configuration.ib_test_account,
      transmit: true,
    };

    this.api.modifyOrder(id, contract, order);
  }

  /**
   * Stop the the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new ModifyOrdersApp().start();
