import TagValue from "../data/container/tag-value";
import SecType from "../data/enum/sec-type";
import { Contract } from "./contract";
import { FundAssetType, FundDistributionPolicyIndicator } from "./fund";
import { IneligibilityReason } from "./ineligibilityReason";

/**
 * Extended contract details.
 */
export interface ContractDetails {
  /** A fully-defined [[Contract]] object. */
  contract: Contract;

  /** The market name for this product. */
  marketName?: string;

  /**
   * The minimum allowed price variation.
   * Note that many securities vary their minimum tick size according to their price.
   *
   * This value will only show the smallest of the different minimum tick sizes regardless of the product's price.
   *
   * Full information about the minimum increment price structure can be obtained with the reqMarketRule function or the IB Contract and Security Search site.
   */
  minTick?: number;

  /**
   * Allows execution and strike prices to be reported consistently with market data, historical data and the order price, i.e. Z on LIFFE is reported in Index points and not GBP.
   *
   * In TWS versions prior to 972, the price magnifier is used in defining future option strike prices (e.g. in the API the strike is specified in dollars, but in TWS it is specified in cents).
   *
   * In TWS versions 972 and higher, the price magnifier is not used in defining futures option strike prices so they are consistent in TWS and the API.
   */
  priceMagnifier?: number;

  /** Supported order types for this product.  */
  orderTypes?: string;

  /**
   * Valid exchange fields when placing an order for this contract.
   *
   * The list of exchanges will is provided in the same order as the corresponding [[marketRuleIds]] list.
   */
  validExchanges?: string;

  /** For derivatives, the contract ID (conID) of the underlying instrument. */
  underConId?: number;

  /**	Descriptive name of the product. */
  longName?: string;

  /** Typically the contract month of the underlying for a Future contract. */
  contractMonth?: string;

  /** The industry classification of the underlying/product. For example, Financial. */
  industry?: string;

  /** The industry category of the underlying. For example, InvestmentSvc. */
  category?: string;

  /**	The industry subcategory of the underlying. For example, Brokerage. */
  subcategory?: string;

  /** The time zone for the trading hours of the product. For example, EST. */
  timeZoneId?: string;

  /**
   * The trading hours of the product.
   * This value will contain the trading hours of the current day as well as the next's.
   * For example, 20090507:0700-1830,1830-2330;20090508:CLOSED.
   *
   * In TWS versions 965+ there is an option in the Global Configuration API settings to return 1 month of trading hours.
   *
   * In TWS version 970+, the format includes the date of the closing time to clarify potential ambiguity, ex: 20180323:0400-20180323:2000;20180326:0400-20180326:2000.
   *
   * The trading hours will correspond to the hours for the product on the associated exchange.
   * The same instrument can have different hours on different exchanges.
   */
  tradingHours?: string;

  /**
   * The liquid hours of the product.
   * This value will contain the liquid hours (regular trading hours) of the contract on the specified exchange.
   *
   * Format for TWS versions until 969: 20090507:0700-1830,1830-2330;20090508:CLOSED.
   *
   * In TWS versions 965+ there is an option in the Global Configuration API settings to return 1 month of trading hours.
   *
   * In TWS v970 and above, the format includes the date of the closing time to clarify potential ambiguity, e.g. 20180323:0930-20180323:1600;20180326:0930-20180326:1600.
   */
  liquidHours?: string;

  /**
   * Contains the Economic Value Rule name and the respective optional argument.
   * The two values should be separated by a colon.
   *
   * For example, aussieBond:YearsToExpiration=3.
   *
   * When the optional argument is not present, the first value will be followed by a colon.
   */
  evRule?: string;

  /**
   * Tells you approximately how much the market value of a contract would change if the price were to change by 1.
   *
   * It cannot be used to get market value by multiplying the price by the approximate multiplier.
   */
  evMultiplier?: number;

  /**
   * Aggregated group Indicates the smart-routing group to which a contract belongs.
   *
   * Contracts which cannot be smart-routed have aggGroup = -1.
   */
  aggGroup?: number;

  /**
   * A list of contract identifiers that the customer is allowed to view CUSIP/ISIN/etc.
   *
   * For US stocks, receiving the ISIN requires the CUSIP market data subscription.
   *
   * For Bonds, the CUSIP or ISIN is input directly into the symbol field of the Contract class.
   */
  secIdList?: TagValue[];

  /** For derivatives, the symbol of the underlying contract. */
  underSymbol?: string;

  /**	For derivatives, returns the underlying security type. */
  underSecType?: SecType;

  /** The list of market rule IDs separated by comma Market rule IDs can be used to determine the minimum price increment at a given price. */
  marketRuleIds?: string;

  /**
   * Real expiration date.
   *
   * Requires TWS 968+ and API v973.04+.
   */
  realExpirationDate?: string;

  /** Last trade time. */
  lastTradeTime?: string;

  /** Stock type.  */
  stockType?: string;

  /**
   * The nine-character bond CUSIP. For Bonds only.
   *
   * Receiving CUSIPs requires a CUSIP market data subscription. */
  cusip?: string;

  /**
   * Identifies the credit rating of the issuer.
   *
   * This field is not currently available from the TWS API.
   *
   * For Bonds only.
   *
   * A higher credit rating generally indicates a less risky investment.
   * Bond ratings are from Moody's and S&P respectively.
   *
   *  Not currently implemented due to bond market data restrictions.
   */
  ratings?: string;

  /**
   * A description string containing further descriptive information about the bond.
   *
   * For Bonds only.
   */
  descAppend?: string;

  /** The type of bond, such as "CORP.". */
  bondType?: string;

  /**
   * The type of bond coupon.
   *
   * This field is currently not available from the TWS API.
   *
   * For Bonds only.
   */
  couponType?: string;

  /**
   * If `true`, the bond can be called by the issuer under certain conditions.
   *
   * This field is currently not available from the TWS API.
   *
   * For Bonds only.
   */
  callable?: boolean;

  /**
   * If `true`, the bond can be sold back to the issuer under certain conditions.
   *
   * This field is currently not available from the TWS API.
   *
   * For Bonds only.
   */
  putable?: boolean;

  /**
   * The interest rate used to calculate the amount you will receive in interest payments over the course of the year.
   *
   * This field is currently not available from the TWS API.
   *
   * For Bonds only.
   */
  coupon?: number;

  /**
   * Values are True or False.
   *
   * If `true`, the bond can be converted to stock under certain conditions.
   *
   * This field is currently not available from the TWS API.
   *
   * For Bonds only.
   */
  convertible?: boolean;

  /**
   * The date on which the issuer must repay the face value of the bond.
   *
   * This field is currently not available from the TWS API.
   *
   * For Bonds only.
   *
   * Not currently implemented due to bond market data restrictions.
   */
  maturity?: string;

  /**
   * The date the bond was issued.
   *
   * This field is currently not available from the TWS API.
   *
   * For Bonds only.
   *
   * Not currently implemented due to bond market data restrictions.
   */
  issueDate?: string;

  /**
   * Only if bond has embedded options.
   *
   * This field is currently not available from the TWS API.
   *
   * Refers to callable bonds and putable bonds.
   *
   * Available in TWS description window for bonds.
   */
  nextOptionDate?: string;

  /**
   * Type of embedded option.
   *
   * This field is currently not available from the TWS API.
   *
   * Only if bond has embedded options.
   */
  nextOptionType?: string;

  /**
   * Only if bond has embedded options.
   *
   * This field is currently not available from the TWS API.
   *
   * For Bonds only.
   */
  nextOptionPartial?: boolean;

  /**
   * If populated for the bond in IB's database.
   *
   * For Bonds only.
   */
  notes?: string;

  /**
   * Order's minimal size.
   */
  minSize?: number;

  /**
   * Order's size increment.
   */
  sizeIncrement?: number;

  /**
   * Order's suggested size increment.
   */
  suggestedSizeIncrement?: number;

  // FUND values
  fundName?: string;
  fundFamily?: string;
  fundType?: string;
  fundFrontLoad?: string;
  fundBackLoad?: string;
  fundBackLoadTimeInterval?: string;
  fundManagementFee?: string;
  fundClosed?: boolean;
  fundClosedForNewInvestors?: boolean;
  fundClosedForNewMoney?: boolean;
  fundNotifyAmount?: string;
  fundMinimumInitialPurchase?: string;
  fundSubsequentMinimumPurchase?: string;
  fundBlueSkyStates?: string;
  fundBlueSkyTerritories?: string;
  fundDistributionPolicyIndicator?: FundDistributionPolicyIndicator;
  fundAssetType?: FundAssetType;
  ineligibilityReasonList?: IneligibilityReason[];
}

export default ContractDetails;
