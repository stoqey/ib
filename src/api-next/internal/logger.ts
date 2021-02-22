export interface Logger {
  info(tag: string, ...args: unknown[]): void;
  warn(tag: string, ...args: unknown[]): void;
  error(tag: string, ...args: unknown[]): void;
  debug(tag: string, ...args: unknown[]): void;
}
