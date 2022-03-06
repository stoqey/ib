/**
 * This App will print IBKR account place orders to console.
 */

import path from "path";

import {
  Contract,
  IBApiNextError,
  Order,
  OrderAction,
  OrderType,
  SecType,
} from "../";
import configuration from "../common/configuration";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////
const DESCRIPTION_TEXT = "Place order.";
const USAGE_TEXT = "Usage: place-orders.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [
  ["price=<number>", "price of an order."],
  ["symbol=<name>", "The symbol name."],
  ["quantity=<number>", "Quantity of an order."],
];
const EXAMPLE_TEXT = "place-orders.js -price=120 -symbol=AMZN -quantity=10";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PlaceOrdersApp extends IBApiNextApp {
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }
  /**
   * Start the app.
   */
  start(): void {
    const scriptName = path.basename(__filename);
    logger.debug(`Starting ${scriptName} script`);

    this.connect(this.cmdLineArgs.watch ? 10000 : 0);

    this.api
      .getNextValidOrderId()
      .then((id) => {
        this.printText(`${id}`);
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
          orderId: id,
          totalQuantity: +this.cmdLineArgs.quantity,
          account: configuration.ib_test_account,
          transmit: true,
        };
        this.api.placeOrder(id, contract, order);
        this.stop();
      })
      .catch((err: IBApiNextError) => {
        this.error(`getNextValidOrderId failed with '${err.error.message}'`);
      });
  }

  /**
   * Stop the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new PlaceOrdersApp().start();
