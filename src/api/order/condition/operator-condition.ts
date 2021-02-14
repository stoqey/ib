import OrderCondition from "./order-condition";

/**
 * TODO document
 */
export interface OperatorCondition extends OrderCondition {
  /** TODO document */
  isMore: boolean;

  /** Value as string representation. */
  readonly strValue: string;
}
