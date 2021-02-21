import { Position } from "..";

/**
 * An update on the positions.
 */
export interface PositionsUpdate {
  /**
   * If true, [[positions]] contains updated positions only.
   * If false, [[positions]] contains all positions.
   */
  incrementalUpdate: boolean;

  /**
   * The list of all, or of the changes positions.
   *
   * @see [[incrementalUpdate]]
   */
  positions: Position[];
}
