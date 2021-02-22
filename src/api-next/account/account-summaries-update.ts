import { AccountSummaries } from "..";

/**
 * An update on account summaries.
 */
export class AccountSummariesUpdate {
  /** Map of changed account summary values since last [[AccountSummariesUpdate]] */
  changed = new AccountSummaries();

  /** Map of all account summary values. */
  all = new AccountSummaries();
}
