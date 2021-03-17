import { ContractDetailsUpdate } from "../../..";
import { ContractDetails } from "../../../..";
import { IBApiNextDataUpdate } from "../../data-update";

/** Mutable version of [[ContractDetailsUpdate]] */
export class MutableContractDetailsUpdate
  extends IBApiNextDataUpdate<ContractDetails[]>
  implements ContractDetailsUpdate {}
