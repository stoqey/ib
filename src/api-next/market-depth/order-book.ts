import { ItemListUpdate } from "..";

/** A row on the order book. */
export interface OrderBookRow {
  /** The order's price. */
  price: number;

  /** The order's size. */
  size: number;

  /**
   * The market maker if there are multiple market makers (e.g on ISLAND / NASDAQ ECN),
   * or undefined if its the exchange (no market makers, such as on ARCA).
   */
  marketMaker?: string;

  /**
   * A flag indicating if this is smart depth response
   * (aggregate data from multiple exchanges, v974+).
   */
  isSmartDepth: boolean;
}

/** A row position index on the order book. */
export type OrderBookRowPosition = number;

/** Rows on the order-book (either ask or bid side) */
export type OrderBookRows = ReadonlyMap<OrderBookRowPosition, OrderBookRow>;

/**
 * The order book.
 */
export interface OrderBook {
  /** Rows on the bid-side. */
  bids: OrderBookRows;

  /** Rows on the ask-side. */
  asks: OrderBookRows;
}

/** An update on the order book. */
export type OrderBookUpdate = ItemListUpdate<OrderBook>;
