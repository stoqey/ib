import { Contract, Order, OrderState } from "../..";

export interface OpenOrder {
  orderId: number;
  contract: Contract;
  order: Order;
  orderState: OrderState;
}
