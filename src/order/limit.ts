import { ACTION } from '../interfaces.share';

export function limit(action: ACTION, quantity: number, price: number, transmitOrder?: boolean) {
  if (transmitOrder === undefined) {
    transmitOrder = true;
  }

  return {
    action: action,
    lmtPrice: price,
    orderType: 'LMT',
    totalQuantity: quantity,
    transmit: transmitOrder
  };
};
