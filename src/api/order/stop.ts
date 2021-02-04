import { OrderAction } from "./order";
import { OrderType } from "./orderType";

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
    public tif?: string
  ) {
    this.transmit = this.transmit ?? true;
    this.parentId = this.parentId ?? 0;
    this.tif = this.tif ?? "DAY";
  }

  public orderType = OrderType.STP;
}
