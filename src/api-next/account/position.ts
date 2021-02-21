import { Contract } from "../..";

/**
 * A position on an IBKR account.
 */
export interface Position {
  /** The account holding the position. */
  account: string;

  /** The position's [[Contract]] */
  contract: Contract;

  /** The number of positions held. */
  pos: number;

  /** The average cost of the position. */
  avgCost: number;
}
