/**
 * WhatToShow.
 */

export const WhatToShow = {
  None: "",

  // only these are valid for real-time bars
  TRADES: "TRADES",
  MIDPOINT: "MIDPOINT",
  BID: "BID",
  ASK: "ASK",

  BID_ASK: "BID_ASK",
  HISTORICAL_VOLATILITY: "HISTORICAL_VOLATILITY",
  OPTION_IMPLIED_VOLATILITY: "OPTION_IMPLIED_VOLATILITY",
  YIELD_ASK: "YIELD_ASK",
  YIELD_BID: "YIELD_BID",
  YIELD_BID_ASK: "YIELD_BID_ASK",
  YIELD_LAST: "YIELD_LAST",
  ADJUSTED_LAST: "ADJUSTED_LAST",
  SCHEDULE: "SCHEDULE",
} as const;
export type WhatToShow = (typeof WhatToShow)[keyof typeof WhatToShow];
