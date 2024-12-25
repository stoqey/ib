import { Contract, Order, OrderState, OrderStatus } from "../..";

export type IBApiNextOrderStatus = {
  status: OrderStatus;
  filled: number;
  remaining: number;
  avgFillPrice: number;
  permId?: number;
  parentId?: number;
  lastFillPrice?: number;
  clientId?: number;
  whyHeld?: string;
  mktCapPrice?: number;
};

export interface OpenOrder {
  orderId: number;
  contract: Contract;
  order: Order;
  orderState: OrderState;
  orderStatus?: IBApiNextOrderStatus;
}
