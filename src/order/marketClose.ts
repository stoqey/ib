import assert from 'assert';
import _ from 'lodash';

export function marketClose(action, quantity, transmitOrder) {
  assert(_.isString(action), 'Action must be a string.');
  assert(_.isNumber(quantity), 'Quantity must be a number.');

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
