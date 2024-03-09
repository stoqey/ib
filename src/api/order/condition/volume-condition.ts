import { ConjunctionConnection } from "../enum/conjunction-connection";
import { OrderConditionType } from "../enum/order-condition-type";
import ContractCondition from "./contract-condition";

/**
 * Used with conditional orders to submit or cancel an order based on a specified volume change in a security.
 */
export class VolumeCondition implements ContractCondition {
  type = OrderConditionType.Volume;

  /**
   * Create a [[PriceCondition]] object.
   *
   * @param volume TODO document
   * @param conId The contract id.
   * @param exchange The exchange code.
   * @param isMore TODO document
   * @param conjunctionConnection Conjunction connection type.
   */
  constructor(
    public volume: number,
    public conId: number,
    public exchange: string,
    public isMore: boolean,
    public conjunctionConnection: ConjunctionConnection,
  ) {}

  get strValue(): string {
    return "" + this.volume;
  }
}

export default VolumeCondition;
