import { PnL } from "./pnl";

/**
 * Daily Profit&Loss information of a position.
 */
export interface PnLSingle extends PnL {
  /** Current size of the position. */
  position?: number;

  /** The current market value of the position. */
  marketValue?: number;
}
