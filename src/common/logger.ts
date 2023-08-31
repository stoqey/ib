/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import colors from "colors";
import * as util from "util";

const timeStamp = () => `[${new Date().toISOString().substring(11, 19)}]`;

const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    const newArgs = [timeStamp(), "Debug:", ...args].map((x) => colors.grey(x));
    console.debug(...newArgs);
  }
};

const info = (...args: any[]) => {
  const newArgs = [timeStamp(), " Info:", ...args].map((x) => colors.green(x));
  console.log(...newArgs);
};

const warn = (...args: any[]) => {
  const newArgs = [timeStamp(), " Warn:", ...args].map((x) => colors.yellow(x));
  console.warn(...newArgs);
};

const error = (...args: any[]) => {
  // Prevent hiding of any stack traces
  const newArgs = [timeStamp(), "Error:", ...args].map((x) =>
    colors.bold.red(typeof x == "string" ? x : util.inspect(x, { showHidden: false, depth: null })),
  );

  console.error(...newArgs);
};

const testError = (...args: any[]) => {
  // Prevent hiding of any stack traces
  const newArgs = args.map((x) => colors.bold.red(util.inspect(x, { showHidden: false, depth: 3 })));

  console.error(...newArgs);
};

export default {
  debug,
  info,
  warn,
  error,
  testError,
};
