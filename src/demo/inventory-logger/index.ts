/**
 * This file implements an app that demos how to get various kind of values
 * of your IBKR accounts.
 */

import { Subscription } from "rxjs";
import { TickType as IBApiTickType } from "../..";
import { ConnectionState } from "../../api/api-auto-connection";
import { IBApiNext, IBApiNextTickType } from "../../api/api-next";
import { IBInventory } from "./ib-inventory";

/** Log output interval in ms. */
const LOG_INTERVAL = 5000;

/**
 * If set to true, all position details will be logger.
 * If set to false, only account overview will be logged.
 */
const SHOW_POSITION_DETAILS = true;

/** Helper function to format a number to string. */
function formatNumber(v: number | undefined): string {
  if (v === undefined) {
    return "?";
  }
  const absVal = Math.abs(v);
  return absVal > 100 ? v.toFixed(0) : absVal > 1 ? v.toFixed(2) : v.toFixed(4);
}

/**
 * Inventory-logger demo app.
 *
 * This app will keep track of the latest inventory values
 * and log to console at certain intervals.
 * It does use [[IBApiNext]] for connection-management + rxjs and
 * [[IBInventory]] to manage the subscriptions.
 */
class IBApiNextInventoryLogger {
  constructor() {
    this.api = new IBApiNext();
    this.inventory = new IBInventory(this.api);
  }

  /** The timeout of the print interval. */
  private printInterval: NodeJS.Timeout;

  /** The [[IBApiNext]] instance. */
  private api: IBApiNext;

  /** The error subscription. */
  private error$?: Subscription;

  /** The connection-state subscription. */
  private connectionState$?: Subscription;

  /** The inventory on IBKR. */
  private inventory: IBInventory;

  /** Print the inventory to log. */
  printInventory(): void {
    console.log(
      `=============== INVENTORY ${new Date().toLocaleTimeString()} ===============`
    );

    console.log(`Accounts (${this.inventory.accounts.length}):`);
    this.inventory.accounts.forEach((account) => {
      console.log(`  ${account.id}`);
      console.log(
        `    Net Liquidation: ${formatNumber(account.netLiquidation)}`
      );
      console.log(`    Daily PnL: ${formatNumber(account.pnl?.dailyPnL)}`);
      console.log(`    Realized: ${formatNumber(account.pnl?.realizedPnL)}`);
      console.log(
        `    Unrealized: ${formatNumber(account.pnl?.unrealizedPnL)}`
      );
      const positions = this.inventory.getPositions(account.id);
      console.log(`    Positions (${positions.length}):`);
      if (SHOW_POSITION_DETAILS) {
        positions.forEach((pos) => {
          console.log(
            `      ${pos.pos} x ${pos.contract.symbol} @ ${pos.contractDetails?.contract.exchange}`
          );
          console.log(`        Name: ${pos.contractDetails?.longName}`);
          console.log(`        Avg. Cost: ${formatNumber(pos.avgCost)}`);
          console.log(`        Daily PnL: ${formatNumber(pos.pnl?.dailyPnL)}`);
          console.log(
            `        Unrealized PnL: ${formatNumber(pos.pnl?.unrealizedPnL)}`
          );
          console.log(`        Market Value: ${formatNumber(pos.pnl?.value)}`);
          console.log(
            `        Bid Price: ${formatNumber(
              pos.marketData.get(IBApiTickType.BID)
            )}`
          );
          console.log(
            `        Bid Size: ${formatNumber(
              pos.marketData.get(IBApiTickType.BID_SIZE)
            )}`
          );
          console.log(
            `        Ask Price: ${formatNumber(
              pos.marketData.get(IBApiTickType.ASK)
            )}`
          );
          console.log(
            `        Ask Size: ${formatNumber(
              pos.marketData.get(IBApiTickType.ASK_SIZE)
            )}`
          );
          console.log(
            `        Option IV: ${formatNumber(
              pos.marketData.get(IBApiNextTickType.MODEL_OPTION_IV)
            )}`
          );
          console.log(
            `        Option Delta: ${formatNumber(
              pos.marketData.get(IBApiNextTickType.MODEL_OPTION_DELTA)
            )}`
          );
          console.log(
            `        Option Gamma: ${formatNumber(
              pos.marketData.get(IBApiNextTickType.MODEL_OPTION_GAMMA)
            )}`
          );
          console.log(
            `        Option Vega: ${formatNumber(
              pos.marketData.get(IBApiNextTickType.MODEL_OPTION_VEGA)
            )}`
          );
          console.log(
            `        Option Theta: ${formatNumber(
              pos.marketData.get(IBApiNextTickType.MODEL_OPTION_THETA)
            )}`
          );
        });
      }
    });
  }

  /**
   * Run the inventory logger.
   */
  run() {
    this.stop();

    // connect, with 5s re-connection interval

    this.api.connect(5000);

    // subscribe on errors

    this.error$ = this.api.error.subscribe((apiError) => {
      console.error(
        `Error: ${apiError.error.message}, code: ${apiError.code} reqId: ${apiError.reqId})`
      );
    });

    // subscribe on connection state

    let firstState = true;
    this.connectionState$ = this.api.connectionState.subscribe((state) => {
      console.log(`Connection state: ${ConnectionState[state]}`);
      if (
        state === ConnectionState.Disconnected &&
        !firstState &&
        this.api.reconnectInterval
      ) {
        console.debug(
          `IBApiAutoConnection: reconnecting in ${
            this.api.reconnectInterval / 1000
          }s...`
        );
      }
      firstState = false;
    });

    // subscribe on inventory

    this.inventory.subscribe();

    /// print inventory

    this.printInterval = setInterval(() => {
      this.printInventory();
    }, LOG_INTERVAL);
  }

  /**
   * Stop the inventory logger.
   */
  stop() {
    this.error$?.unsubscribe();
    this.connectionState$?.unsubscribe();
    this.inventory.unsubscribe();
    this.api.disconnect();
    clearInterval(this.printInterval);
  }
}

// run demo app

new IBApiNextInventoryLogger().run(); // we never stop
