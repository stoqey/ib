import { ConjunctionConnection } from "../enum/conjunction-connection";
import { OrderConditionType } from "../enum/order-condition-type";
import ContractCondition from "./contract-condition";

/**
 * Used with conditional orders to place or submit an order based on a percentage change of an instrument to the last close price.
 */
export class PercentChangeCondition implements ContractCondition {
  type = OrderConditionType.PercentChange;

  /**
   * Create a [[PercentChangeCondition]] object.
   *
   * @param percent TODO document
   * @param conId The contract id.
   * @param exchange The exchange code.
   * @param isMore TODO document
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public percent: number,
    public conId: number,
    public exchange: string,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection,
  ) {}

  get strValue(): string {
    return "" + this.percent;
  }
}

export default PercentChangeCondition;
