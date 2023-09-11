/**
 * Base-interface for updates events on a list of data items.
 */
export interface ItemListUpdate<T> {
  /** All items with its latest values, as received by TWS. */
  readonly all: T;

  /** all value is set with all items (ie not still being built = End message received from TWS) */
  readonly allset?: boolean;

  /** Items that have been added since last [[IBApiNextUpdate]]. */
  readonly added?: T;

  /** Items that have been changed since last [[IBApiNextUpdate]]. */
  readonly changed?: T;

  /** Items that has been removed since last [[IBApiNextUpdate]]. */
  readonly removed?: T;
}
