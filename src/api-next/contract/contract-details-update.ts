import ContractDetails from "../../api/contract/contractDetails";
import { ItemListUpdate } from "../common/item-list-update";

/** An update on contract details. */
export type ContractDetailsUpdate = ItemListUpdate<ContractDetails[]>;
