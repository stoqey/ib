/* eslint-disable @typescript-eslint/no-explicit-any */

import { bold, green, grey, red, yellow } from "./ansi-colors";
import * as util from "util";

const timeStamp = () => `[${new Date().toISOString().substring(11, 19)}]`;

const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    const newArgs = [timeStamp(), "Debug:", ...args].map((x) => grey(x));
    console.debug(...newArgs);
  }
};

const info = (...args: any[]) => {
  const newArgs = [timeStamp(), " Info:", ...args].map((x) => green(x));
  console.log(...newArgs);
};

const warn = (...args: any[]) => {
  const newArgs = [timeStamp(), " Warn:", ...args].map((x) => yellow(x));
  console.warn(...newArgs);
};

const error = (...args: any[]) => {
  // Prevent hiding of any stack traces
  const newArgs = [timeStamp(), "Error:", ...args].map((x) =>
    bold(
      red(
        typeof x == "string"
          ? x
          : util.inspect(x, { showHidden: false, depth: null }),
      ),
    ),
  );

  console.error(...newArgs);
};

const testError = (...args: any[]) => {
  // Prevent hiding of any stack traces
  const newArgs = args.map((x) =>
    bold(red(util.inspect(x, { showHidden: false, depth: 3 }))),
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
