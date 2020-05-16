/**
 * Stock contract
 * @param symbol 
 * @param exchange 
 * @param currency 
 */
export function stock(symbol: string, exchange?: string, currency?: string) {

  return {
    currency: currency || 'USD',
    exchange: exchange || 'SMART',
    secType: 'STK',
    symbol
  };
};