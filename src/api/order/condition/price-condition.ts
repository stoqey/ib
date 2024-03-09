import { ConjunctionConnection } from "../enum/conjunction-connection";
import { OrderConditionType } from "../enum/order-condition-type";
import { TriggerMethod } from "../enum/trigger-method";
import ContractCondition from "./contract-condition";

/**
 * Used with conditional orders to cancel or submit order based on price of an instrument.
 */
export class PriceCondition implements ContractCondition {
  type = OrderConditionType.Price;

  /**
   * Create a [[PriceCondition]] object.
   *
   * @param price TODO document
   * @param triggerMethod TODO document
   * @param conId The contract id.
   * @param exchange The exchange code.
   * @param isMore TODO document
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public price: number,
    public triggerMethod: TriggerMethod,
    public conId: number,
    public exchange: string,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection,
  ) {}

  get strValue(): string {
    return "" + this.price;
  }
}

export default PriceCondition;
