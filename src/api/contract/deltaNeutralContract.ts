/**
 * Delta-Neutral Contract.
 */
export interface DeltaNeutralContract {
  /**
   * The unique contract identifier specifying the security.
   * Used for Delta-Neutral Combo contracts.
   */
  conId: number;

  /** The underlying stock or future delta. Used for Delta-Neutral Combo contracts. */
  delta: number;

  /** The price of the underlying. Used for Delta-Neutral Combo contracts. */
  price: number;
}
