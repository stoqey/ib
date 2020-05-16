var assert = require('assert');

var _ = require('lodash');

export default function (symbol, currency, exchange) {
  assert(_.isString(symbol), 'Symbol must be a string.');

  return {
    currency: currency || 'USD',
    exchange: exchange || 'SMART',
    secType: 'BAG',
    symbol: symbol
  };
};
