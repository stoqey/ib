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
   * @param isMore If there is a price percent change measured against last close price above or below...
   * @param percent this amount...
   * @param conId on this contract
   * @param exchange when traded on this exchange...
   * @param conjunctionConnection AND | OR next condition (will be ignored if no more conditions are added)
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
