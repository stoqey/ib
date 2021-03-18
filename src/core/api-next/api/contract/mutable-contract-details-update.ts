import { ContractDetailsUpdate } from "../../../../api-next";
import { ContractDetails } from "../../../..";
import { IBApiNextItemListUpdate } from "../../item-list-update";

/** Mutable version of [[ContractDetailsUpdate]] */
export class MutableContractDetailsUpdate
  extends IBApiNextItemListUpdate<ContractDetails[]>
  implements ContractDetailsUpdate {}
