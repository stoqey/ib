import { OrderAction } from "./order";
import { OrderType } from "./orderType";

/**
 * Represents a stop-limit order.
 */
export class StopLimitOrder {
  constructor(
    public action: OrderAction,
    public lmtPrice: number,
    public auxPrice: number,
    public totalQuantity?: boolean,
    public transmit?: boolean,
    public parentId?: number,
    public tif?: string
  ) {
    this.transmit = this.transmit ?? true;
    this.parentId = this.parentId ?? 0;
    this.tif = this.tif ?? "DAY";
  }

  public orderType = OrderType.STP_LMT;
}
