import { AccountId, AccountSummaryValues, AccountSummary } from "..";

/**
 * A Map with the summaries of all linked IB accounts, with account id as key.
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
