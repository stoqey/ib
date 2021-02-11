/** An account id. */
export type AccountId = string;

/** An account summary value tag name. */
export type AccountSummaryTagName = string;

/** The currency of a value on the account summary. */
export type AccountSummaryValueCurrency = string;

/**
 * A value on an account summary.
 *
 * Note same value on account summary can exists in different
 * currencies (therefore this is a Map, with currency code
 * as key).
 */
export class AccountSummaryValue extends Map<
  AccountSummaryValueCurrency,
  string
> {
  constructor(init?: [AccountSummaryValueCurrency, string][]) {
    super(init);
  }
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
  getOrAdd(tag: AccountSummaryTagName): AccountSummaryValue {
    let result = this.get(tag);
    if (result === undefined) {
      result = new AccountSummaryValue();
      this.set(tag, result);
    }
    return result;
  }
}

/**
 * An account summary on [[IBApiNext]].
 */
export class AccountSummary {
  /**
   * Create an [[AccountSummary]] object.
   *
   * @param account The account id.
   */
  constructor(
    public readonly account: string,
    init?: [AccountSummaryTagName, AccountSummaryValue][]
  ) {
    this.values = new AccountSummaryValues(init);
  }

  /** Map of of account summary values, with tag name as key. */
  readonly values: AccountSummaryValues;
}
