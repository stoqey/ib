import { Contract, Execution } from "../..";

export interface ExecutionDetail {
  reqId: number;
  contract: Contract;
  execution: Execution;
}
