/**
 * Financial Advisor's configuration data types.
 */
export enum FADataType {
  /** Offer traders a way to create a group of accounts and apply a single allocation method to all accounts in the group. */
  GROUPS = 1,

  /** Let you allocate shares on an account-by-account basis using a predefined calculation value. */
  PROFILES = 2,

  /** Let you easily identify the accounts by meaningful names rather than account numbers. */
  ALIASES = 3,
}
