/**
 * This App will place orders to IBKR.
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

const scriptName = path.basename(__filename);

// The help text.
const DESCRIPTION_TEXT = "Place order.";
const USAGE_TEXT = `Usage: ${scriptName} <options>`;
const OPTION_ARGUMENTS: [string, string][] = [
  ...IBApiNextApp.DEFAULT_CONTRACT_OPTIONS,
  ["price=<number>", "price of an order."],
  ["quantity=<number>", "Quantity of an order."],
];
const EXAMPLE_TEXT = `${scriptName} -price=120 -symbol=AMZN -quantity=10`;

const awaitTimeout = (delay: number): Promise<unknown> =>
  new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, delay * 1000));

class App extends IBApiNextApp {
  /**
   * Initialise the app.
   */
  constructor() {
    super(DESCRIPTION_TEXT, USAGE_TEXT, OPTION_ARGUMENTS, EXAMPLE_TEXT);
  }

  /**
   * Start the app.
   */
  start(): void {
    this.info(`Starting ${scriptName} script`);
    this.connect();

    this.api
      .getNextValidOrderId()
      .then((id) => {
        const contract: Contract = {
          symbol: this.cmdLineArgs.symbol as string,
          exchange: this.cmdLineArgs.exchange as string,
          currency: this.cmdLineArgs.currency as string,
          secType: this.cmdLineArgs.sectype as SecType,
        };
        // this.printObject(contract);

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
        this.printText(`Order Id ${id} sent`);
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
    // Give a 2 secs chance to get any server feedback before exiting
    awaitTimeout(2).then(() => {
      logger.info(`${scriptName} script done.`);
      this.exit();
    });
  }
}

// run the app
new App().start();
