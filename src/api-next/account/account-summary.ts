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

  /** The account summary values. */
  readonly values: AccountSummaryValues;
}
