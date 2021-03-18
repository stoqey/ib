import { ItemListUpdate } from "../../api-next/common/item-list-update";

/**
 * @internal
 *
 * Implementation fo the DataUpdate interface.
 */

export class IBApiNextItemListUpdate<T> implements ItemListUpdate<T> {
  constructor(
    public readonly all: T,
    public readonly added?: T,
    public readonly changed?: T,
    public readonly removed?: T
  ) {}
}
