import { ACTION } from '../interfaces.share';

export function marketClose(action: ACTION, quantity: number, transmitOrder?: boolean) {

  if (transmitOrder === undefined) {
    transmitOrder = true;
  }

  return {
    action: action,
    orderType: 'MOC',
    totalQuantity: quantity,
    transmit: transmitOrder
  };
};
