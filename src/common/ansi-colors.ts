const wrap =
  (open: string, close: string) =>
  (value: unknown): string =>
    `${open}${String(value)}${close}`;

export const grey = wrap("\x1b[90m", "\x1b[39m");
export const green = wrap("\x1b[32m", "\x1b[39m");
export const yellow = wrap("\x1b[33m", "\x1b[39m");
export const red = wrap("\x1b[31m", "\x1b[39m");
export const bold = wrap("\x1b[1m", "\x1b[22m");
