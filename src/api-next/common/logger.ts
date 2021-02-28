import { LogLevel } from "..";

/**
 * [[IBApiNext]] logger interface.
 */
export interface IBApiNextLogger {
  /** Get or set the log level. */
  logLevel: LogLevel;

  /** Log a debug information. */
  info(tag: string, ...args: unknown[]): void;

  /** Log a generic information. */
  warn(tag: string, ...args: unknown[]): void;

  /** Log a warning. */
  error(tag: string, ...args: unknown[]): void;

  /** Log an error. */
  debug(tag: string, ...args: unknown[]): void;
}
