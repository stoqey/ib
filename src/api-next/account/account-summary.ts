/** An account id. */
export type AccountId = string;

/** An account summary value tag name. */
export type AccountSummaryTagName = string;

/**
 * A value on an account summary.
 */
export interface AccountSummaryValue {
  /** The actual value. */
  value: string;

  /* The currency of the value. */
  currency: string;
}

/**
 * Map of values on an account summary, wit tag name as key.
 */
export class AccountSummaryValues extends Map<
  AccountSummaryTagName,
  AccountSummaryValue
> {
  constructor(init?: [AccountSummaryTagName, AccountSummaryValue][]) {
    super(init);
  }
}

/**
 * An account summary on [[IBApiNext]].
 */
export interface AccountSummary {
  /** The account id. */
  account: string;

  /** The account summary values. */
  values: AccountSummaryValues;
}

/**
 * Map wit the summaries of all linked IB accounts, with account id as key.
 */
export class AccountSummaries extends Map<AccountId, AccountSummary> {
  constructor(init?: [AccountId, AccountSummary][]) {
    super(init);
  }
  getOrAdd(id: AccountId): AccountSummary {
    let result = this.get(id);
    if (result === undefined) {
      result = { account: id, values: new AccountSummaryValues() };
      this.set(id, result);
    }
    return result;
  }
}
