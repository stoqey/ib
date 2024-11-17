import { Order, OrderAction, OrderType, TimeInForce } from "../../..";

export const sample_order: Order = {
  orderType: OrderType.LMT,
  action: OrderAction.BUY,
  lmtPrice: 0.01,
  totalQuantity: 1,
  conditionsIgnoreRth: true,
  conditionsCancelOrder: false,
  tif: TimeInForce.DAY,
  transmit: true,
};
