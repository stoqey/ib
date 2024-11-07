import { Liquidities } from "../..";

/**
 * Type describing an order's execution.
 */
export interface Execution {
  /** The API client's order Id. May not be unique to an account. */
  orderId?: number;

  /** The API client identifier which placed the order which originated this execution. */
  clientId?: number;

  /**
   * The execution's identifier.
   *
   * Each partial fill has a separate ExecId.
   *
   * A correction is indicated by an ExecId which differs from a previous ExecId in only the digits after the final period, e.g. an ExecId ending in ".02" would be a correction of a previous execution with an ExecId ending in ".01".
   */
  execId?: string;

  /** The execution's server time. */
  time?: string;

  /** The account to which the order was allocated. */
  acctNumber?: string;

  /** The exchange where the execution took place. */
  exchange?: string;

  /** Specifies if the transaction was buy or sale BOT for bought, SLD for sold. */
  side?: string;

  /** The number of shares filled. */
  shares?: number;

  /** The order's execution price excluding commissions. */
  price?: number;

  /** The TWS order identifier. The PermId can be 0 for trades originating outside IB. */
  permId?: number;

  /** Identifies whether an execution occurred because of an IB-initiated liquidation. */
  liquidation?: number;

  /** Cumulative quantity. Used in regular trades, combo trades and legs of the combo. */
  cumQty?: number;

  /** Average price. Used in regular trades, combo trades and legs of the combo. Does not include commissions. */
  avgPrice?: number;

  /**	The OrderRef is a user-customizable string that can be set from the API or TWS and will be associated with an order for its lifetime.  */
  orderRef?: string;

  /**
   * The Economic Value Rule name and the respective optional argument. The two values should be separated by a colon.
   *
   * For example, aussieBond:YearsToExpiration=3.
   *
   * When the optional argument is not present, the first value will be followed by a colon.
   */
  evRule?: string;

  /**
   * Tells you approximately how much the market value of a contract would change if the price were to change by 1.
   *
   * It cannot be used to get market value by multiplying the price by the approximate multiplier.
   */
  evMultiplier?: number;

  /** The model code. */
  modelCode?: string;

  /**
   * The liquidity type of the execution.
   *
   * Requires TWS 968+ and API v973.05+.
   */
  lastLiquidity?: Liquidities;

  pendingPriceRevision?: boolean;
}

export default Execution;
