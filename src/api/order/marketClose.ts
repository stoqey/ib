import { OrderAction } from "./order";
import { OrderType } from "./oderType";

/**
 * Represents a limit order.
 */
export class MarketCloseOrder {

  constructor(
    public action: OrderAction,
    public totalQuantity: number,
    public transmit: boolean = true) { }

  public orderType = OrderType.MarketClose;
}
