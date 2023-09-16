/**
 * This App will print IBKR account place new orders to console.
 */

import { Contract, Order, OrderAction, OrderType, SecType } from "../";
import configuration from "../common/configuration";
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
];
const EXAMPLE_TEXT =
  "place-new-orders.js -price=120 -symbol=AMZN -quantity=10 -clientId=0";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PlaceNewOrdersApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }
  /**
   * Start the app.
   */
  start(): void {
    super.start();

    const contract: Contract = {
      symbol: this.cmdLineArgs.symbol as string,
      exchange: "SMART",
      currency: "USD",
      secType: SecType.STK,
    };

    const order: Order = {
      orderType: OrderType.LMT,
      action: OrderAction.BUY,
      lmtPrice: +this.cmdLineArgs.price,
      totalQuantity: +this.cmdLineArgs.quantity,
      account: configuration.ib_test_account,
      transmit: true,
    };
    this.api.placeNewOrder(contract, order).then((orderId: number) => {
      this.printText(orderId.toString());
      this.stop();
    });
    //setTimeout(process.exit(0), 3000);
  }

  /**
   * Stop the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new PlaceNewOrdersApp().start();
