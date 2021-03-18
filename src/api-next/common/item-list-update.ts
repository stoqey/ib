/**
 * Base-interface for updates on item lists.
 */
export interface ItemListUpdate<T> {
  /** All latest data items as received by TWS. */
  readonly all: T;

  /** Keys of data items that have been added since last [[IBApiNextUpdate]]. */
  readonly added?: T;

  /** Keys of data items that have been changed since last [[IBApiNextUpdate]]. */
  readonly changed?: T;

  /** Keys of data items that has been removed since last [[IBApiNextUpdate]]. */
  readonly removed?: T;
}
