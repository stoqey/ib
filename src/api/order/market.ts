import { OrderAction } from "./order";
import { OrderType } from "./orderType";

/**
 * Represents a limit order.
 */
export class MarketOrder {
  constructor(
    public action: OrderAction,
    public totalQuantity: number,
    public transmit?: boolean,
    public goodAfterTime?: string,
    public goodTillDate?: string
  ) {
    this.transmit = this.transmit ?? true;
    this.goodAfterTime = this.goodAfterTime ?? "";
    this.goodTillDate = this.goodTillDate ?? "";
  }

  public orderType = OrderType.MKT;
}
