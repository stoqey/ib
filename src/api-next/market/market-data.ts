import { ItemListUpdate, TickType } from "..";

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

/** A a set of market data ticks. */
export type MarketDataTicks = ReadonlyMap<TickType, MarketDataTick>;

/** A market data update. */
export type MarketDataUpdate = ItemListUpdate<MarketDataTicks>;
