import { Position } from "..";

/**
 * An update on the positions.
 */
export class PositionsUpdate {
  /** List of positions, that have been opened since last [[PositionsUpdate]]. */
  opened: Position[] = [];

  /** List of positions, that have been change since last [[PositionsUpdate]]. */
  changed: Position[] = [];

  /** List of positions, that have been closed since last [[PositionsUpdate]]. */
  closed: Position[] = [];

  /** List of all currently open positions. */
  all: Position[] = [];
}
