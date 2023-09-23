/**
 * Market data tick types.
 *
 * @see https://interactivebrokers.github.io/tws-api/tick_types.html
 */
export enum TickType {
  /** Number of contracts or lots offered at the bid price. */
  BID_SIZE = 0,

  /** Highest priced bid for the contract. */
  BID = 1,

  /** Lowest price offer on the contract.. */
  ASK = 2,

  /** Number of contracts or lots offered at the ask price. */
  ASK_SIZE = 3,

  /** Last price at which the contract traded. */
  LAST = 4,

  /** Number of contracts or lots traded at the last price. */
  LAST_SIZE = 5,

  /** High price for the day. */
  HIGH = 6,

  /** Low price for the day. */
  LOW = 7,

  /** Trading volume for the day for the selected contract (US Stocks: multiplier 100). */
  VOLUME = 8,

  /**
   * The last available closing price for the previous day.
   * For US Equities, we use corporate action processing to get the closing price,
   * so the close price is adjusted to reflect forward and reverse splits and cash and stock dividends.
   */
  CLOSE = 9,

  /** Computed Greeks for the underlying stock price and the option reference price. */
  BID_OPTION = 10,

  /** Computed Greeks for the underlying stock price and the option reference price. */
  ASK_OPTION = 11,

  /** Computed Greeks for the underlying stock price and the option reference price */
  LAST_OPTION = 12,

  /** Computed Greeks and model's implied volatility for the underlying stock price and the option reference price. */
  MODEL_OPTION = 13,

  /** Today's opening price. */
  OPEN = 14,

  /** Lowest price for the last 13 weeks. */
  LOW_13_WEEK = 15,

  /** Highest price for the last 13 weeks. */
  HIGH_13_WEEK = 16,

  /** Lowest price for the last 26 weeks. */
  LOW_26_WEEK = 17,

  /** Highest price for the last 26 weeks. */
  HIGH_26_WEEK = 18,

  /** Lowest price for the last 52 weeks. */
  LOW_52_WEEK = 19,

  /** Highest price for the last 52 weeks. */
  HIGH_52_WEEK = 20,

  /** The average daily trading volume over 90 days (multiply this value times 100). */
  AVG_VOLUME = 21,

  /** Total number of options that were not closed. */
  OPEN_INTEREST = 22,

  /** The 30-day historical volatility (currently for stocks). */
  OPTION_HISTORICAL_VOL = 23,

  /**
   * A prediction of how volatile an underlying will be in the future.
   * The IB 30-day volatility is the at-market volatility estimated for a maturity thirty calendar days forward of the current trading day,
   * and is based on option prices from two consecutive expiration months.
   */
  OPTION_IMPLIED_VOL = 24,

  /** Not Used. */
  OPTION_BID_EXCH = 25,

  /** Not Used. */
  OPTION_ASK_EXCH = 26,

  /**	Call option open interest. */
  OPTION_CALL_OPEN_INTEREST = 27,

  /** Put option open interest. */
  OPTION_PUT_OPEN_INTEREST = 28,

  /** Call option volume for the trading day. */
  OPTION_CALL_VOLUME = 29,

  /** Put option volume for the trading day. */
  OPTION_PUT_VOLUME = 30,

  /** The number of points that the index is over the cash index. */
  INDEX_FUTURE_PREMIUM = 31,

  /** Identifies the options exchange(s) posting the best bid price on the options contract. */
  BID_EXCH = 32,

  /** Identifies the options exchange(s) posting the best ask price on the options contract. */
  ASK_EXCH = 33,

  /** The number of shares that would trade if no new orders were received and the auction were held now. */
  AUCTION_VOLUME = 34,

  /**
   * The price at which the auction would occur if no new orders were received and the auction were held now.
   * The indicative price for the auction.
   */
  AUCTION_PRICE = 35,

  /**
   * The number of unmatched shares for the next auction; returns how many more shares are on one side of the auction than the other.
   */
  AUCTION_IMBALANCE = 36,

  /**
   * The mark price is equal to the Last Price unless: Ask < Last - the mark price is equal to the Ask Price.
   * Bid > Last - the mark price is equal to the Bid Price.
   */
  MARK_PRICE = 37,

  /** Computed EFP bid price. */
  BID_EFP_COMPUTATION = 38,

  /** Computed EFP ask price. */
  ASK_EFP_COMPUTATION = 39,

  /** Computed EFP last price. */
  LAST_EFP_COMPUTATION = 40,

  /** Computed EFP open price. */
  OPEN_EFP_COMPUTATION = 41,

  /** Computed high EFP traded price for the day. */
  HIGH_EFP_COMPUTATION = 42,

  /** Computed low EFP traded price for the day. */
  LOW_EFP_COMPUTATION = 43,

  /** Computed closing EFP traded price for the day. */
  CLOSE_EFP_COMPUTATION = 44,

  /** Time of the last trade (in UNIX time). */
  LAST_TIMESTAMP = 45,

  /** Describes the level of difficulty with which the contract can be sold short. */
  SHORTABLE = 46,

  /** Provides the available Reuter's Fundamental Ratios. */
  FUNDAMENTAL_RATIOS = 47,

  /** Last trade details. */
  RT_VOLUME = 48,

  /** Indicates if a contract is halted */
  HALTED = 49,

  /** Implied yield of the bond if it is purchased at the current bid. */
  BID_YIELD = 50,

  /**	Implied yield of the bond if it is purchased at the current ask. */
  ASK_YIELD = 51,

  /** Implied yield of the bond if it is purchased at the last price. */
  LAST_YIELD = 52,

  /** Greek values are based off a user customized price. */
  CUST_OPTION_COMPUTATION = 53,

  /** Trade count for the day. */
  TRADE_COUNT = 54,

  /** Trade count per minute. */
  TRADE_RATE = 55,

  /** Volume per minute. */
  VOLUME_RATE = 56,

  /** Last Regular Trading Hours traded price. */
  LAST_RTH_TRADE = 57,

  /** 30-day real time historical volatility. */
  RT_HISTORICAL_VOL = 58,

  /** Contract's dividends. */
  IB_DIVIDENDS = 59,

  /** The bond factor is a number that indicates the ratio of the current bond principal to the original principal. */
  BOND_FACTOR_MULTIPLIER = 60,

  /**
   * The imbalance that is used to determine which at-the-open or at-the-close orders can be
   * entered following the publishing of the regulatory imbalance.
   */
  REGULATORY_IMBALANCE = 61,

  /** Contract's news feed. */
  NEWS_TICK = 62,

  /** The past three minutes volume. Interpolation may be applied. */
  SHORT_TERM_VOLUME_3_MIN = 63,

  /** The past five minutes volume. Interpolation may be applied. */
  SHORT_TERM_VOLUME_5_MIN = 64,

  /** The past ten minutes volume. Interpolation may be applied. */
  SHORT_TERM_VOLUME_10_MIN = 65,

  /** Delayed bid price */
  DELAYED_BID = 66,

  /** Delayed ask price. */
  DELAYED_ASK = 67,

  /** Delayed last traded price.  */
  DELAYED_LAST = 68,

  /** Delayed bid size. */
  DELAYED_BID_SIZE = 69,

  /** Delayed ask size. */
  DELAYED_ASK_SIZE = 70,

  /** Delayed last size. */
  DELAYED_LAST_SIZE = 71,

  /** Delayed highest price of the day.  */
  DELAYED_HIGH = 72,

  /** Delayed lowest price of the day.  */
  DELAYED_LOW = 73,

  /** Delayed traded volume of the day.  */
  DELAYED_VOLUME = 74,

  /** Delayed close price of the day.  */
  DELAYED_CLOSE = 75,

  /** Delayed open price of the day.  */
  DELAYED_OPEN = 76,

  /** Last trade details that excludes "Unreportable Trades" */
  RT_TRD_VOLUME = 77,

  /* Not currently available. */
  CREDITMAN_MARK_PRICE = 78,

  /** Slower mark price update used in system calculations */
  CREDITMAN_SLOW_MARK_PRICE = 79,

  /** Delayed computed Greeks for the underlying stock price and the option reference price.. */
  DELAYED_BID_OPTION = 80,

  /** Delayed computed Greeks for the underlying stock price and the option reference price. */
  DELAYED_ASK_OPTION = 81,

  /** Delayed computed Greeks for the underlying stock price and the option reference price. */
  DELAYED_LAST_OPTION = 82,

  /** Delayed computed Greeks and model's implied volatility for the underlying stock price and the option reference price. */
  DELAYED_MODEL_OPTION = 83,

  /** Exchange of last traded price. */
  LAST_EXCH = 84,

  /** Timestamp (in Unix ms time) of last trade returned with regulatory snapshot. */
  LAST_REG_TIME = 85,

  /** Total number of outstanding futures contracts (TWS v965+). *HSI open interest requested with generic tick 101. */
  FUTURES_OPEN_INTEREST = 86,

  /** Average volume of the corresponding option contracts(TWS Build 970+ is required). */
  AVG_OPT_VOLUME = 87,

  /** Delayed time of the last trade (in UNIX time) (TWS Build 970+ is required) */
  DELAYED_LAST_TIMESTAMP = 88,

  /** Number of shares available to short (TWS Build 974+ is required) */
  SHORTABLE_SHARES = 89,

  DELAYED_HALTED = 90,

  REUTERS_2_MUTUAL_FUNDS = 91,

  /**
   * Today's closing price of ETF's Net Asset Value (NAV).
   * Calculation is based on prices of ETF's underlying securities.
   */
  ETF_NAV_CLOSE = 92,

  /**
   * Yesterday's closing price of ETF's Net Asset Value (NAV).
   * Calculation is based on prices of ETF's underlying securities.
   */
  ETF_NAV_PRIOR_CLOSE = 93,

  /**
   * The bid price of ETF's Net Asset Value (NAV).
   * Calculation is based on prices of ETF's underlying securities.
   */
  ETF_NAV_BID = 94,

  /**
   * The ask price of ETF's Net Asset Value (NAV).
   * Calculation is based on prices of ETF's underlying securities.
   */
  ETF_NAV_ASK = 95,

  /**
   * The last price of Net Asset Value (NAV).
   * For ETFs: Calculation is based on prices of ETF's underlying securities.
   * For NextShares: Value is provided by NASDAQ.
   */
  ETF_NAV_LAST = 96,

  /** ETF Nav Last for Frozen data. */
  ETF_NAV_FROZEN_LAST = 97,

  /** The high price of ETF's Net Asset Value (NAV). */
  ETF_NAV_HIGH = 98,

  /** The low price of ETF's Net Asset Value (NAV). */
  ETF_NAV_LOW = 99,

  /** TBD */
  SOCIAL_MARKET_ANALYTICS = 100,

  /** Midpoint is calculated based on IPO price range */
  ESTIMATED_IPO_MIDPOINT = 101,

  /** Final price for IPO */
  FINAL_IPO_LAST = 102,

  /** TBD */
  DELAYED_YIELD_BID = 103,

  /** TBD */
  DELAYED_YIELD_ASK = 104,

  UNKNOWN = 2147483647, // MAX int32
}

export default TickType;
