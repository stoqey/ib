import { TickType } from "..";

/**
 * A market data tick on [[IBApiNext]].
 */
export class MarketDataTick extends Map<TickType, number> {
  constructor(init?: [TickType, number][]) {
    super(init);
  }

  /**
   * The ingress timestamp (UNIX) of the market data tick.
   *
   * This is the time when tick has been received from TWS
   * (not the time of the actual tick on exchange / SMART ticker).
   */
  public readonly ingressTimestamp: number = Date.now();
}
