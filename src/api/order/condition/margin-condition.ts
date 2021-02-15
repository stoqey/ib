import { ConjunctionConnection } from "../enum/conjunction-connection";
import { OrderConditionType } from "../enum/order-condition-type";
import { OperatorCondition } from "./operator-condition";

/**
 * TODO document
 */
export class MarginCondition implements OperatorCondition {
  type = OrderConditionType.Margin;

  /**
   * Create a [[MarginCondition]] object.
   *
   * @param percent TODO document
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public percent: number,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection
  ) {}

  get strValue(): string {
    return "" + this.percent;
  }
}

export default MarginCondition;
