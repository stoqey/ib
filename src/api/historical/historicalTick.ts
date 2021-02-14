/**
 * The historical tick's description.
 *
 * Used when requesting historical tick data with whatToShow = MIDPOINT.
 */
export interface HistoricalTick {
  /** The UNIX timestamp of the historical tick. */
  time: number;

  /** The historical tick price. */
  price: number;

  /** The historical tick size. */
  size: number;
}

export default HistoricalTick;
