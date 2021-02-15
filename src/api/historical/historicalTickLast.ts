/**
 * Attributes of a [[HistoricalTickBidAsk]].
 */
export interface TickAttribBidAsk {
  /** TODO document */
  pastLimit?: boolean;

  /** TODO document */
  unreported?: boolean;
}

/**
 * The historical last tick's description.
 *
 * Used when requesting historical tick data with whatToShow = TRADES.
 */
export interface HistoricalTickLast {
  /** The UNIX timestamp of the historical tick. */
  time?: number;

  /** Tick attribs of historical last tick. */
  tickAttribBidAsk?: TickAttribBidAsk;

  /** The last price of the historical tick. */
  price?: number;

  /** The last size of the historical tick. */
  size?: number;

  /** The source exchange of the historical tick. */
  exchange?: string;

  /**
   * The conditions of the historical tick.
   *
   * Refer to Trade Conditions page for more details: https://www.interactivebrokers.com/en/index.php?f=7235.
   */
  specialConditions?: string;
}

export default HistoricalTickLast;
