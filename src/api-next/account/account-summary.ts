import { AccountId, CurrencyCode } from "..";
import { ItemListUpdate } from "../common/item-list-update";

/** An account summary value tag name. */
export type AccountSummaryTagName = string;

/** A value on the account summary. */
export interface AccountSummaryValue {
  /** The value. */
  readonly value: string;

  /**
   * The ingress timestamp (UNIX) of the value.
   *
   * This is the time when [IBApi] has been received the value from TWS
   * (not the timestamp of the actual tick on exchange ticker).
   */
  readonly ingressTm: number;
}

/**
 * A value on an account summary.
 *
 * Note same value on account summary can exists in different
 * currencies (therefore this is an Map, with currency code as key).
 */
export type AccountSummaryValues = ReadonlyMap<
  CurrencyCode,
  AccountSummaryValue
>;

/** Map of tag values on the account summary, with tag name as key. */
export type AccountSummaryTagValues = ReadonlyMap<
  AccountSummaryTagName,
  AccountSummaryValues
>;

/** Summary of all linked accounts, with account id as key. */
export type AccountSummaries = ReadonlyMap<AccountId, AccountSummaryTagValues>;

/** An update on the account the summaries. */
export type AccountSummariesUpdate = ItemListUpdate<AccountSummaries>;
