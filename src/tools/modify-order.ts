/**
 * This App will print IBKR account modify orders to console.
 */

import path from "path";

import { Contract, Order, OrderAction, OrderType, SecType } from "../";
import configuration from "../common/configuration";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Modify order.";
const USAGE_TEXT = "Usage: modify-orders.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["price=<number>", "price of an order."],
  ["quantity=<number>", "Quantity of an order."],
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
   * Start the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    this.info(`Starting ${scriptName} script`);
    this.connect();

    const id: number = +this.cmdLineArgs.orderId;

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
   * Stop the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new ModifyOrdersApp().start();
