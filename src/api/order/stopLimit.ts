import OrderAction from "./enum/order-action";
import { OrderType } from "./enum/orderType";
import { TimeInForce } from "./enum/tif";

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
    public tif?: TimeInForce,
  ) {
    this.transmit = this.transmit ?? true;
    this.parentId = this.parentId ?? 0;
    this.tif = this.tif ?? TimeInForce.DAY;
  }

  public orderType = OrderType.STP_LMT;
}

export default StopLimitOrder;
