import colors from "colors";
import { LogLevel } from "../..";

/**
 * @internal
 *
 * The logger implementation of [[IBApiNext]].
 */
export class IBApiNextLogger {
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
  logDebug(tag: string, text: string): void {
    if (this._logLevel >= LogLevel.DETAIL) {
      console.log(
        `[${new Date().toLocaleTimeString()}] [DEBUG] [${tag}]: ${text}`
      );
    }
  }

  /** Log a generic information. */
  logInfo(tag: string, text: string): void {
    if (this._logLevel >= LogLevel.INFO) {
      console.log(
        `[${new Date().toLocaleTimeString()}] [INFO] [${tag}]: ${text}`
      );
    }
  }

  /** Log a warning. */
  logWarn(tag: string, text: string): void {
    if (this._logLevel >= LogLevel.WARN) {
      console.log(
        colors.bold.yellow(
          `[${new Date().toLocaleTimeString()}] [ERROR] [${tag}]: ${text}`
        )
      );
    }
  }

  /** Log an error. */
  logError(tag: string, text: string): void {
    if (this._logLevel >= LogLevel.ERROR) {
      console.error(
        colors.bold.red(
          `[${new Date().toLocaleTimeString()}] [ERROR] [${tag}]: ${text}`
        )
      );
    }
  }
}
