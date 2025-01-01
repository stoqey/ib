import colors from "colors";
import * as util from "util";
import { Logger, LogLevel } from "../..";

/**
 * @internal
 *
 * The logger implementation of [[IBApiNext]].
 */
export class ConsoleLogger implements Logger {
  /** The current log level */
  private _logLevel = LogLevel.SYSTEM;

  /** Get the current log level. */
  get logLevel(): LogLevel {
    return this._logLevel;
  }

  /** Set the current log level. */
  set logLevel(level: LogLevel) {
    this._logLevel = level;
  }

  /** Log a debug information. */
  debug(tag: string, args: unknown[] | string): void {
    if (this._logLevel >= LogLevel.DETAIL) {
      console.debug(
        `[${new Date().toLocaleTimeString()}] [DEBUG] [${tag}]: `,
        args,
      );
    }
  }

  /** Log a generic information. */
  info(tag: string, args: unknown[] | string): void {
    if (this._logLevel >= LogLevel.INFO) {
      console.log(
        `[${new Date().toLocaleTimeString()}] [INFO] [${tag}]: `,
        args,
      );
    }
  }

  /** Log a warning. */
  warn(tag: string, args: unknown[] | string): void {
    if (this._logLevel >= LogLevel.WARN) {
      let newArgs = args;
      if (Array.isArray(args)) newArgs = args.map(colors.yellow);
      console.warn(
        colors.bold.yellow(
          `[${new Date().toLocaleTimeString()}] [WARN] [${tag}]: `,
        ),
        newArgs,
      );
    }
  }

  /** Log an error. */
  error(tag: string, args: unknown[] | string): void {
    if (this._logLevel >= LogLevel.ERROR) {
      let newArgs = args;
      if (Array.isArray(args))
        newArgs = args.map((x) =>
          colors.bold.red(util.inspect(x, { showHidden: false, depth: null })),
        );

      console.error(
        colors.bold.red(
          `[${new Date().toLocaleTimeString()}] [ERROR] [${tag}]:`,
        ),
        newArgs,
      );
    }
  }
}
