import SecType from "../../data/enum/sec-type";
import { ConjunctionConnection } from "../enum/conjunction-connection";
import { OrderConditionType } from "../enum/order-condition-type";
import OrderCondition from "./order-condition";

/**
 * This class represents a condition requiring a specific execution event to be fulfilled.
 *
 * Orders can be activated or canceled if a set of given conditions is met.
 * An ExecutionCondition is met whenever a trade occurs on a certain product at the given exchange.
 */
export class ExecutionCondition implements OrderCondition {
  type = OrderConditionType.Execution;

  /**
   * Create a [[ExecutionCondition]] object.
   *
   * @param exchange Exchange where the symbol needs to be traded.
   * @param secType Kind of instrument being monitored.
   * @param symbol 	Instrument's symbol.
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public exchange: string,
    public secType: SecType,
    public symbol: string,
    public conjunctionConnection: ConjunctionConnection
  ) {}
}

export default ExecutionCondition;
