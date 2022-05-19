import { OpenOrder } from "../..";
import { ItemListUpdate } from "../common/item-list-update";

/** An update on open orders. */
export type OpenOrdersUpdate = ItemListUpdate<OpenOrder[]>;
