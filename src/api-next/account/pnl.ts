/**
 * Daily Profit&Loss information.
 */
export interface PnL {
  /** The daily PnL. */
  dailyPnL?: number;

  /** The daily unrealized PnL. */
  unrealizedPnL?: number;

  /** The daily realized PnL. */
  realizedPnL?: number;
}
