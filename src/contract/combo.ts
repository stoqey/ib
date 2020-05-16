/**
 * Combo
 * @param symbol 
 * @param currency 
 * @param exchange 
 */
export function combo(symbol: string, currency?: string, exchange?: string) {
  return {
    currency: currency || 'USD',
    exchange: exchange || 'SMART',
    secType: 'BAG',
    symbol: symbol
  };
};
