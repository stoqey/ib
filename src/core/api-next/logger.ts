import { LogLevel } from "../..";
import { Logger } from "../../api-next/common/logger";

/**
 * @internal
 *
 * The logger proxy to filter log levels.
 */
export class IBApiNextLogger {
  constructor(private logger: Logger) {}

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
      this.logger.debug(tag, args);
    }
  }

  /** Log a generic information. */
  info(tag: string, args: unknown[] | string): void {
    if (this._logLevel >= LogLevel.INFO) {
      this.logger.info(tag, args);
    }
  }

  /** Log a warning. */
  warn(tag: string, args: unknown[] | string): void {
    if (this._logLevel >= LogLevel.WARN) {
      this.logger.warn(tag, args);
    }
  }

  /** Log an error. */
  error(tag: string, args: unknown[] | string): void {
    if (this._logLevel >= LogLevel.ERROR) {
      this.logger.error(tag, args);
    }
  }
}
