import { TickAttribLast } from "../historical/historicalTickLast";

/**
 * Tick-by-tick last or all last price data.
 *
 * Used when requesting tick-by-tick data with tickType = LAST or ALL_LAST.
 */
export interface TickByTickAllLast {
  /** The UNIX timestamp of the tick. */
  time: number;

  /** The price of the tick. */
  price: number;

  /** The size of the tick. */
  size: number;

  /** The tick attributes of the tick. */
  tickAttribLast: TickAttribLast;

  /** The exchange of the tick. */
  exchange: string;

  /** The special conditions of the tick. */
  specialConditions: string;
}
