/**
 * IBApiNext logger interface.
 */
export interface Logger {
  /** Log an info message. */
  info(tag: string, ...args: unknown[]): void;

  /** Log a warning message. */
  warn(tag: string, ...args: unknown[]): void;

  /** Log an error message. */
  error(tag: string, ...args: unknown[]): void;

  /** Log a debug message. */
  debug(tag: string, ...args: unknown[]): void;
}
