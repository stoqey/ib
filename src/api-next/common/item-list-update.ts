/**
 * Base-interface for updates events on a list of data items.
 */
export interface ItemListUpdate<T> {
  /** All items with its latest values, as received by TWS. */
  readonly all: T;

  /** Items that have been added since last [[IBApiNextUpdate]]. */
  readonly added?: T;

  /** Items that have been changed since last [[IBApiNextUpdate]]. */
  readonly changed?: T;

  /** Items that has been removed since last [[IBApiNextUpdate]]. */
  readonly removed?: T;
}
