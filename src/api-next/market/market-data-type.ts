/**
 * TWS market data types.
 */
export enum MarketDataType {
  /* Disables frozen, delayed and delayed-frozen market data. */
  REALTIME = 1,

  /* Enables frozen market data. */
  FROZEN = 2,

  /* Enables delayed and disables delayed-frozen market data. */
  DELAYED = 3,

  /* Enables delayed and delayed-frozen market data. */
  DELAYED_FROZEN = 4,
}
