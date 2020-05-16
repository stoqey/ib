import assert from 'assert';
import _ from 'lodash';

export function future(symbol, expiry, currency, exchange, multiplier) {
  assert(_.isString(symbol), 'Symbol must be a string.');
  assert(_.isString(expiry), 'Expiry must be a string.');

  return {
    secType: 'FUT',
    symbol: symbol,
    expiry: expiry,
    currency: currency || 'USD',
    exchange: exchange || 'ONE',
    multiplier: multiplier
  };
};
