import { ACTION } from '../interfaces.share';

export function trailingStop(action: ACTION, quantity: number, auxPrice: number, tif?: string, transmitOrder?: boolean, parentId?: number) {

  return {
    action: action,
    totalQuantity: quantity,
    orderType: 'TRAIL',  // https://www.interactivebrokers.com/en/software/api/apiguide/tables/supported_order_types.htm
    auxPrice: auxPrice,
    tif,  // note - TRAIL orders are only triggered during the trading hours of the contract
    transmit: transmitOrder || true,
    parentId: parentId || 0
  };
};
