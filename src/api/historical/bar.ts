/**
 * The historical data bar's description.
 */
export interface Bar {
  /**
   * The bar's date and time (either as a yyyymmss hh:mm:ss formatted string or as system time according to the request).
   *
   * Time zone is the TWS time zone chosen on login.
   */
  time?: string;

  /** The bar's open price. */
  open?: number;

  /** The bar's high price. */
  high?: number;

  /** The bar's low price. */
  low?: number;

  /** The bar's close price. */
  close?: number;

  /** The bar's traded volume if available (only available for TRADES). */
  volume?: number;

  /** The bar's Weighted Average Price (only available for TRADES). */
  WAP?: number;

  /** The number of trades during the bar's timespan (only available for TRADES). */
  count?: number;
}
