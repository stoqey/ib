import { ACTION } from '../interfaces.share';

export function market(action: ACTION, quantity: number, transmitOrder?: boolean, goodAfterTime?: string, goodTillDate?: string) {

  if (transmitOrder === undefined) {
    transmitOrder = true;
  }

  if (goodAfterTime === undefined) {
    goodAfterTime = '';
  }

  if (goodTillDate === undefined) {
    goodTillDate = '';
  }

  return {
    action: action,
    orderType: 'MKT',
    totalQuantity: quantity,
    transmit: transmitOrder,
    goodAfterTime: goodAfterTime,
    goodTillDate: goodTillDate
  };
};
