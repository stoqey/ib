import { TickType } from "../..";

/**
 * A market data tick.
 */
export interface MarketDataTick {
  values: Map<TickType, number>;
}
