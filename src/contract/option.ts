import assert from 'assert';
import _ from 'lodash';

export function option(symbol, expiry, strike, right, exchange, currency) {
  assert(_.isString(right), 'Right must be a string.');
  assert(_.isString(symbol), 'Symbol must be a string.');
  assert(_.isString(expiry), 'Expiry must be a string.');
  assert(_.isNumber(strike), 'Strike must be a number.');

  return {
    currency: currency || 'USD',
    exchange: exchange || 'SMART',
    expiry: expiry,
    multiplier: 100,
    right: right,
    secType: 'OPT',
    strike: strike,
    symbol: symbol
  };
};
