import { ContractDetailsUpdate } from "../../../../api-next";
import { ContractDetails } from "../../../..";
import { IBApiNextDataUpdate } from "../../data-update";

/** Mutable version of [[ContractDetailsUpdate]] */
export class MutableContractDetailsUpdate
  extends IBApiNextDataUpdate<ContractDetails[]>
  implements ContractDetailsUpdate {}
