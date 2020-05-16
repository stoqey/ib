export * from './combo'
export * from './forex'
export * from './future'
export * from './fop'
export * from './option'
export * from './stock'
export * from './cfd'

export default function (symbol: string, currency?: string, exchange?: string) {

    return {
        currency: currency || 'USD',
        exchange: exchange || 'CBOE',
        secType: 'IND',
        symbol: symbol
    };
};