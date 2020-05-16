export function cfd(symbol: string, currency?: string, exchange?: string) {
  return {
    currency: currency || 'USD',
    exchange: exchange || 'SMART',
    secType: 'CFD',
    symbol: symbol
  };
};
