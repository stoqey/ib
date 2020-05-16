
/**
 * Option contact
 * @param symbol 
 * @param expiry 
 * @param strike 
 * @param right 
 * @param exchange 
 * @param currency 
 */
export function option(symbol: string, expiry: string, strike: string, right: string, exchange?: string, currency?: string) {
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
