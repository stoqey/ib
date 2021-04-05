import { TickType, ItemListUpdate } from "../..";

/**  A market data tick on [[IBApiNext]]. */
export interface MarketDataTick {
  /** The tick value. */
  readonly value: number;

  /**
   * The ingress timestamp (UNIX) of the value.
   *
   * This is the time when [IBApi] has been received the value from TWS
   * (not the timestamp of the actual tick on exchange ticker).
   */
  readonly ingressTm: number;
}

/** ReadonlyMap of all market data ticks, with [[TickType]] as key. */
export type MarketDataTicks = ReadonlyMap<TickType, MarketDataTick>;

/** An update on market data. */
export type MarketDataUpdate = ItemListUpdate<MarketDataTicks>;
