import { OderStatus } from "../..";

/**
 * Provides an active order's current state.
 */
export interface OrderState {
  /** The order's current status. */
  status?: OderStatus;

  /** The account's current initial margin. */
  initMarginBefore?: number;

  /** The account's current maintenance margin. */
  maintMarginBefore?: number;

  /** The account's current equity with loan. */
  equityWithLoanBefore?: number;

  /** The change of the account's initial margin. */
  initMarginChange?: number;

  /** The change of the account's maintenance margin. */
  maintMarginChange?: number;

  /** The change of the account's equity with loan. */
  equityWithLoanChange?: number;

  /** The order's impact on the account's initial margin. */
  initMarginAfter?: number;

  /** The order's impact on the account's maintenance margin. */
  maintMarginAfter?: number;

  /** Shows the impact the order would have on the account's equity with loan. */
  equityWithLoanAfter?: number;

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

export default OrderState;
