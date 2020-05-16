import { ACTION } from '../interfaces.share';

export function stopLimit(action: ACTION, quantity: number, limitPrice: number, stopPrice: number, transmitOrder?: boolean, parentId?: number, tif?: string) {

  return {
    action: action,
    lmtPrice: limitPrice,
    auxPrice: stopPrice,
    orderType: 'STP LMT',
    totalQuantity: quantity,
    transmit: transmitOrder || true,
    parentId: parentId || 0,
    tif: tif || 'DAY'
  };
};
