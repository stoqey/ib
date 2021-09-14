/**
 * This App will print IBKR account place orders to console.
 */

import path from "path";
import { Subscription } from "rxjs";

import {
  Contract,
  IBApiNextError,
  Order,
  OrderAction,
  OrderType,
  SecType,
} from "../";
import logger from "../common/logger";
import { IBApiNextApp } from "./common/ib-api-next-app";

/////////////////////////////////////////////////////////////////////////////////
// The help text.                                                              //
/////////////////////////////////////////////////////////////////////////////////

const DESCRIPTION_TEXT = "Place order.";
const USAGE_TEXT = "Usage: place-orders.js <options>";
const OPTION_ARGUMENTS: [string, string][] = [];
const EXAMPLE_TEXT = "place-orders.js";

//////////////////////////////////////////////////////////////////////////////
// The App code                                                             //
//////////////////////////////////////////////////////////////////////////////

class PlaceOrdersApp extends IBApiNextApp {
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

    this.api
      .getNextValidOrderId()
      .then((id) => {
        this.printText(`${id}`);
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
          orderId: id,
          totalQuantity: 10,
          account: "DU3360023",
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
   * Stop the the app with success code.
   */
  stop() {
    this.exit();
  }
}

// run the app

new PlaceOrdersApp().start();
