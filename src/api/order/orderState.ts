/**
 * Provides an active order's current state.
 */
export interface OrderState {
  /** The order's current status. */
  status?: string;

  /** The account's current initial margin. */
  initMarginBefore?: string;

  /** The account's current maintenance margin. */
  maintMarginBefore?: string;

  /** The account's current equity with loan. */
  equityWithLoanBefore?: string;

  /** The change of the account's initial margin. */
  initMarginChange?: string;

  /** The change of the account's maintenance margin. */
  maintMarginChange?: string;

  /** The change of the account's equity with loan. */
  equityWithLoanChange?: string;

  /** The order's impact on the account's initial margin. */
  initMarginAfter?: string;

  /** The order's impact on the account's maintenance margin. */
  maintMarginAfter?: string;

  /** Shows the impact the order would have on the account's equity with loan. */
  equityWithLoanAfter?: string;

  /** The order's generated commission. */
  commission?: number;

  /** The execution's minimum commission. */
  minCommission?: number;

  /** The executions maximum commission. */
  maxCommission?: number;

  /** The generated commission currency. */
  commissionCurrency?: string;

  /** If the order is warranted, a descriptive message will be provided. */
  warningText?: string;

  /** TODO document */
  completedTime?: string;

  /** TODO document */
  completedStatus?: string;
}
