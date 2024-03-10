import { ConjunctionConnection } from "../enum/conjunction-connection";
import { OrderConditionType } from "../enum/order-condition-type";
import { OperatorCondition } from "./operator-condition";

/**
 * TODO document
 */
export class TimeCondition implements OperatorCondition {
  type = OrderConditionType.Time;

  /**
   * Create a [[TimeCondition]] object.
   *
   * @param isMore Before or after...
   * @param time this time... (Valid format: "YYYYMMDD HH:MM:SS")
   * @param conjunctionConnection AND | OR next condition (will be ignored if no more conditions are added)
   */
  constructor(
    public time: string,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection,
  ) {}

  get strValue(): string {
    return this.time;
  }
}

export default TimeCondition;
