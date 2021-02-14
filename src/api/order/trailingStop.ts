import OrderAction from "./enum/order-action";
import { OrderType } from "./enum/orderType";

/**
 * Represents a trailing-stop order.
 */
export class TrailingStopOrder {
  constructor(
    public action: OrderAction,
    public totalQuantity: number,
    public auxPrice: number,
    public transmit?: boolean,
    public parentId?: number,
    public tif?: string
  ) {
    this.transmit = this.transmit ?? true;
    this.parentId = this.parentId ?? 0;
    this.tif = this.tif ?? "DAY";
  }

  public orderType = OrderType.TRAIL;
}
