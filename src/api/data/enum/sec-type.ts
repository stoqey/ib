/**
 * Security types.
 */
export enum SecType {
  /** Stock (or ETF) */
  STK = "STK",

  /* Option. */
  OPT = "OPT",

  /* Future */
  FUT = "FUT",

  /* Index. */
  IND = "IND",

  /** Futures option. */
  FOP = "FOP",

  /** Contract for Difference. */
  CFD = "CFD",

  /** Forex pair. */
  CASH = "CASH",

  /** Combo. */
  BAG = "BAG",

  /** Warrant. */
  WAR = "WAR",

  /** Bond. */
  BOND = "BOND",

  /** Commodity. */
  CMDTY = "CMDTY",

  /** News. */
  NEWS = "NEWS",

  /** Mutual fund. */
  FUND = "FUND",
}

export default SecType;
