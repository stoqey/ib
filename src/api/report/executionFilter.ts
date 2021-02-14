import SecType from "../data/enum/sec-type";

/**
 * When requesting executions, a filter can be specified to receive only a subset of them .
 */
export interface ExecutionFilter {
  /** The API client which placed the order. */
  clientId?: string;

  /** The account to which the order was allocated to. */
  acctCode?: string;

  /** Time from which the executions will be returned yyyymmdd hh:mm:ss Only those executions reported after the specified time will be returned.. */
  time?: string;

  /** The instrument's symbol. */
  symbol?: string;

  /** The Contract's security's type. */
  secType?: SecType;

  /** The exchange at which the execution was produced.. */
  exchange?: string;

  /** The Contract's side ("BUY" or "SELL") */
  side?: string;
}

export default ExecutionFilter;
