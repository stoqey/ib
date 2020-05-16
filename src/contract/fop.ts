/**
 * FOP contract
 * @param symbol 
 * @param expiry 
 * @param strike 
 * @param right 
 * @param multiplier 
 * @param exchange 
 * @param currency 
 */
export function fop(symbol: string, expiry: string, strike: string, right: string, multiplier?: number, exchange?: string, currency?: string) {

  return {
    currency: currency || 'USD',
    exchange: exchange || 'GLOBEX',
    expiry: expiry,
    multiplier: multiplier || 50,
    right: right,
    secType: 'FOP',
    strike: strike,
    symbol: symbol
  };
};

