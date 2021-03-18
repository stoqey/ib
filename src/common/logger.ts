/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as util from "util";
import colors from "colors";

const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.debug(...args);
  }
};

// We can't do "exports.info = console.log" because that prevents
// this module from being tested properly with mock logging functions.
const info = (...args: any[]) => console.log(...args);

const warn = (...args: any[]) => {
  const newArgs = args.map(colors.yellow);
  console.warn(...newArgs);
};

const error = (...args: any[]) => {
  // Prevent hiding of any stack traces
  const newArgs = args.map((x) =>
    colors.bold.red(util.inspect(x, { showHidden: false, depth: null }))
  );

  console.error(...newArgs);
};

const testError = (...args: any[]) => {
  // Prevent hiding of any stack traces
  const newArgs = args.map((x) =>
    colors.bold.red(util.inspect(x, { showHidden: false, depth: 3 }))
  );

  console.error(...newArgs);
};

export default {
  debug,
  info,
  warn,
  error,
  testError,
};
