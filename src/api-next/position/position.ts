import { AccountId, Contract, ItemListUpdate } from "../..";

/**
 * A position on an IBKR account.
 */
export interface Position {
  /** The IBKR account Id. */
  readonly account: AccountId;

  /** The position's [[Contract]] */
  readonly contract: Contract;

  /** The number of positions held. */
  readonly pos: number;

  /** The average cost of the position. */
  readonly avgCost?: number;

  /** the market price of the contract. */
  readonly marketPrice?: number;

  /** the market value of the position. */
  readonly marketValue?: number;

  /** The unrealized PNL of the position. */
  readonly unrealizedPNL?: number;

  /** The realized PNL of the position. */
  readonly realizedPNL?: number;
}

/** Summary of all linked accounts, with account id as key. */
export type AccountPositions = ReadonlyMap<AccountId, Position[]>;

/** An update on the account summaries. */
export type AccountPositionsUpdate = ItemListUpdate<AccountPositions>;
