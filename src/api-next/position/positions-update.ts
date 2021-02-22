import { Position } from "..";

/**
 * An update on the positions.
 */
export class PositionsUpdate {
  /** List of positions, that have been added since last [[PositionsUpdate]]. */
  added: Position[] = [];

  /** List of positions, that have been changed since last [[PositionsUpdate]]. */
  changed: Position[] = [];

  /** List of positions, that have been removed since last [[PositionsUpdate]]. */
  removed: Position[] = [];

  /** List of all currently open positions. */
  all: Position[] = [];
}
