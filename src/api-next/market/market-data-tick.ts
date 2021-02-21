import { TickType } from "..";

/**
 * A market data tick on [[IBApiNext]].
 */
export class MarketDataTick extends Map<TickType, number> {
  constructor(init?: [TickType, number][]) {
    super(init);
  }
}
