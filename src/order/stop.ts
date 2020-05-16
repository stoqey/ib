import { ACTION } from '../interfaces.share';

export function stop(action: ACTION, quantity: number, price: number, transmitOrder?: boolean, parentId?: number, tif?: string) {

  return {
    action: action,
    auxPrice: price,
    orderType: 'STP',
    totalQuantity: quantity,
    transmit: transmitOrder || true,
    parentId: parentId || 0,
    tif: tif || 'DAY'
  };
};
