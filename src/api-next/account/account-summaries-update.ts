import { AccountSummaries } from "..";

/**
 * An update on account summaries.
 */
export class AccountSummariesUpdate {
  /** List of changed account summary values since last [[AccountSummariesUpdate]] */
  readonly changed = new AccountSummaries();

  /** Map of all account summary values, with account id as key. */
  readonly all = new AccountSummaries();
}
