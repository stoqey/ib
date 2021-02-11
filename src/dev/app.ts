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

import IBApi, { ErrorCode, EventName } from "..";

function run() {
  const ib = new IBApi();

  ib.on(EventName.error, (err: Error, code: ErrorCode, id: number) => {
    console.error(`${err.message} - code: ${code} - id: ${id}`);
  });

  ib.on(EventName.connected, () => {
    // add your test code here
  });

  ib.connect();
}

// lets give debugger some time to attach before running the code
const timeout = setTimeout(() => {
  clearTimeout(timeout);
  run();
}, 1000);
