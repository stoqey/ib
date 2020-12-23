import { OrderAction } from "./order";
import { OrderType } from "./oderType";

/**
 * Represents a limit order.
 */
export class LimitOrder {

  constructor(
    public action: OrderAction,
    public lmtPrice: number,
    public totalQuantity: number,
    public transmit: boolean = true) { }

  public orderType = OrderType.LMT;
}
