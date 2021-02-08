/**
 * Attributes of a [[HistoricalTickBidAsk]].
 */
export interface TickAttribBidAsk {
  /** TODO document */
  bidPastLow?: boolean;

  /** TODO document */
  askPastHigh?: boolean;
}

/**
 * The historical tick's description.
 *
 * Used when requesting historical tick data with whatToShow = BID_ASK.
 */
export interface HistoricalTickBidAsk {
  /** The UNIX timestamp of the historical tick. */
  time?: number;

  /** Tick attribs of historical bid/ask tick. */
  tickAttribBidAsk?: TickAttribBidAsk;

  /** The bid price of the historical tick. */
  priceBid?: number;

  /** The ask price of the historical tick. */
  priceAsk?: number;

  /** he bid size of the historical tick. */
  sizeBid?: number;

  /** The ask size of the historical tick. */
  sizeAsk?: number;
}
