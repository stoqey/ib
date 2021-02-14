import { ConjunctionConnection } from "../enum/conjunction-connection";
import { OrderConditionType } from "../enum/order-condition-type";

/**
 * An order execution condition
 */
export default interface OrderCondition {
  /** Condition type */
  type: OrderConditionType;

  /** Conjunction connection type. */
  conjunctionConnection: ConjunctionConnection;
}
