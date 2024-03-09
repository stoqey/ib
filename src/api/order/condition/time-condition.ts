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
   * @param time Time field used in conditional order logic. Valid format: YYYYMMDD HH:MM:SS.
   * @param isMore TODO
   * @param conjunctionConnection Conjunction connection type.
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
