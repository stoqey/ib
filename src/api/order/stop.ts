import OrderAction from "./enum/order-action";
import { OrderType } from "./enum/orderType";
import { TimeInForce } from "./enum/tif";

/**
 * Represents a stop order.
 */
export class StopOrder {
  constructor(
    public action: OrderAction,
    public auxPrice: number,
    public totalQuantity: number,
    public transmit?: boolean,
    public parentId?: number,
    public tif?: TimeInForce,
  ) {
    this.transmit = this.transmit ?? true;
    this.parentId = this.parentId ?? 0;
    this.tif = this.tif ?? TimeInForce.DAY;
  }

  public orderType = OrderType.STP;
}

export default StopOrder;
