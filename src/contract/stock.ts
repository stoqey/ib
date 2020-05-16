import assert from 'assert';
import _ from 'lodash';

export function stock(symbol: string, exchange?: string, currency?: string) {

  return {
    currency: currency || 'USD',
    exchange: exchange || 'SMART',
    secType: 'STK',
    symbol
  };
};