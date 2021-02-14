import OrderAction from "./enum/order-action";
import { OrderType } from "./enum/orderType";

/**
 * Represents a limit order.
 */
export class MarketCloseOrder {
  constructor(
    public action: OrderAction,
    public totalQuantity: number,
    public transmit: boolean = true
  ) {}

  public orderType = OrderType.MOC;
}

export default MarketCloseOrder;
