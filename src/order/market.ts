import assert from 'assert';
import _ from 'lodash';

export function market(action, quantity, transmitOrder, goodAfterTime, goodTillDate) {
  assert(_.isString(action), 'Action must be a string.');
  assert(_.isNumber(quantity), 'Quantity must be a number.');

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
