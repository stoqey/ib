/**
 * Future contract
 * @param symbol 
 * @param expiry 
 * @param currency 
 * @param exchange 
 * @param multiplier 
 */
export function future(symbol: string, expiry: string, currency?: string, exchange?: string, multiplier?: number) {
  return {
    secType: 'FUT',
    symbol: symbol,
    expiry: expiry,
    currency: currency || 'USD',
    exchange: exchange || 'ONE',
    multiplier: multiplier
  };
};
