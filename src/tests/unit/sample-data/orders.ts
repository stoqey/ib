import { Order, OrderAction, OrderType, TimeInForce } from "../../..";

export const sample_order: Order = {
  orderType: OrderType.LMT,
  action: OrderAction.BUY,
  lmtPrice: 1,
  totalQuantity: 1,
  conditionsIgnoreRth: true,
  conditionsCancelOrder: false,
  tif: TimeInForce.DAY,
  transmit: true,
  goodAfterTime: "20300101-01:01:01",
};
