/**
 * This files contains a small app for development purpose.
 *
 * How to use:
 * - Set a breakpoint.
 * - Hit F5 to launch debugger on VSCode.
 * - Hit Shit+Ctrl+B to run ts-node-dev as build task.
 *
 * App will restart automatically if a code change is detected.
 */

import { Subscription } from "rxjs";
import { IBApiCreationOptions } from "../api/api";
import { IBApiNext } from "../api/api-next";

class IBApiNextDemo {
  constructor(private options?: IBApiCreationOptions) {
    // connect, with 5s re-connection interval
    this.ib.connect(5000);
  }

  /** The [[IBApiNext]] object */
  private readonly ib = new IBApiNext(this.options);

  /** Subscription on the positions. */
  private positions$?: Subscription;

  /** Start the [[IBApiNext]] demo code. */
  start(): void {
    // subscribe on positions

    this.positions$ = this.ib.getPositions().subscribe((positions) => {
      console.log("Positions:");
      positions.forEach((pos) =>
        console.log(`   ${pos.pos} x ${pos.contract.symbol} @ ${pos.avgCost}`)
      );
    });
  }

  /** Stop the [[IBApiNext]] demo code. */
  stop(): void {
    this.positions$?.unsubscribe();
    this.ib.disconnect();
  }
}

// lets give debugger some time to attach before running the code
const timeout = setTimeout(() => {
  clearTimeout(timeout);
  new IBApiNextDemo().start(); // we never stop
}, 1000);
