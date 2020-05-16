import _ from 'lodash';

// Between two currencies,
// Whatever currency comes first should be in "symbol" and the other one must be in "currency".
// EUR GBP AUD USD TRY ZAR CAD CHF MXN HKD JPY INR NOK SEK RUB

export const CURRENCIES = [
  'KRW', 'EUR', 'GBP', 'AUD',
  'USD', 'TRY', 'ZAR', 'CAD',
  'CHF', 'MXN', 'HKD', 'JPY',
  'INR', 'NOK', 'SEK', 'RUB'
];

/**
 * Forex contract
 * @param symbol 
 * @param currency 
 */
export function forex(symbol: string, currency: string) {
  let temp;

  // Swap between symbol and currency if the ordering is incorrect.
  if (CURRENCIES.indexOf(symbol) > CURRENCIES.indexOf(currency)) {
    temp = symbol;
    symbol = currency;
    currency = temp;
  }

  return {
    currency: currency,
    exchange: 'IDEALPRO',
    secType: 'CASH',
    symbol: symbol
  };
};
