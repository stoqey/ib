export function index(symbol: string, currency?: string, exchange?: string) {

  return {
    currency: currency || 'USD',
    exchange: exchange || 'CBOE',
    secType: 'IND',
    symbol
  };
};