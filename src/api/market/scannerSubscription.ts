/**
 * Defines a market scanner request.
 */
export interface ScannerSubscription {
  /** The number of rows to be returned for the query. */
  numberOfRows?: number;

  /** The instrument's type for the scan. I.e. STK, FUT.HK, etc. */
  instrument?: string;

  /** The request's location (STK.US, STK.US.MAJOR, etc). */
  locationCode?: string;

  /** Same as TWS Market Scanner's "parameters" field, for example: TOP_PERC_GAIN. */
  scanCode?: string;

  /** Filters out Contracts which price is below this value. */
  abovePrice?: number;

  /** Filters out contracts which price is above this value. */
  belowPrice?: number;

  /** Filters out Contracts which volume is above this value. */
  aboveVolume?: number;

  /** Filters out Contracts which option volume is above this value. */
  averageOptionVolumeAbove?: number;

  /** Filters out Contracts which market cap is above this value. */
  marketCapAbove?: number;

  /** Filters out Contracts which market cap is below this value. */
  marketCapBelow?: number;

  /** Filters out Contracts which Moody's rating is below this value. */
  moodyRatingAbove?: string;

  /** Filters out Contracts which Moody's rating is above this value. */
  moodyRatingBelow?: string;

  /** Filters out Contracts with a S&P rating below this value. */
  spRatingAbove?: string;

  /** Filters out Contracts with a S&P rating above this value. */
  spRatingBelow?: string;

  /** Filter out Contracts with a maturity date earlier than this value. */
  maturityDateAbove?: string;

  /** Filter out Contracts with a maturity date older than this value. */
  maturityDateBelow?: string;

  /** Filter out Contracts with a coupon rate lower than this value. */
  couponRateAbove?: number;

  /** Filter out Contracts with a coupon rate higher than this value. */
  couponRateBelow?: number;

  /** Filters out Convertible bonds. */
  excludeConvertible?: boolean;

  /** For example, a pairing "Annual, true" used on the "top Option Implied Vol % Gainers" scan would return annualized volatilities. */
  scannerSettingPairs?: string;

  /**
   * - CORP = Corporation
   * - ADR = American Depositary Receipt
   * - ETF = Exchange Traded Fund
   * - REIT = Real Estate Investment Trust
   * - CEF = Closed End Fund
   */
  stockTypeFilter?: string;
}
