import OptionType from "../data/enum/option-type";
import SecType from "../data/enum/sec-type";
import { ComboLeg } from "./comboLeg";
import { DeltaNeutralContract } from "./deltaNeutralContract";

/**
 * An instrument's definition.
 */
export interface Contract {
  /** The unique IB contract identifier. */
  conId?: number;

  /** The asset symbol. */
  symbol: string;

  /** The security type   */
  secType: SecType;

  /**
   * The contract's last trading day or contract month (for Options and Futures).
   *
   * Strings with format YYYYMM will be interpreted as the Contract Month whereas YYYYMMDD will be interpreted as Last Trading Day.
   */
  lastTradeDateOrContractMonth?: string;

  /** The option's strike price. */
  strike?: number;

  /** Either Put or Call (i.e. Options). Valid values are P, PUT, C, CALL. */
  right?: OptionType;

  /** The instrument's multiplier (i.e. options, futures). */
  multiplier?: number;

  /** The destination exchange. */
  exchange: string;

  /** The trading currency. */
  currency: string;

  /** The contract's symbol within its primary exchange For options, this will be the OCC symbol. */
  localSymbol?: string;

  /**
   * The contract's primary exchange. For smart routed contracts, used to define contract in case of ambiguity.
   * Should be defined as native exchange of contract, e.g. ISLAND for MSFT For exchanges which contain a period in name,
   * will only be part of exchange name prior to period, i.e. ENEXT for ENEXT.BE.
   */
  primaryExch?: string;

  /** The trading class name for this contract. Available in TWS contract description window as well. For example, GBL Dec '13 future's trading class is "FGBL". */
  tradingClass?: string;

  /**
   * If set to `true`, contract details requests and historical data queries can be performed pertaining to expired futures contracts.
   * Expired options or other instrument types are not available.
   */
  includeExpired?: boolean;

  /**
   * Security's identifier when querying contract's details or placing orders
   *
   * ISIN - Example: Apple: US0378331005.
   *
   * CUSIP - Example: Apple: 037833100.
   */
  secIdType?: string;

  /** Identifier of the security type. */
  secId?: string;

  /** Description of the combo legs. */
  comboLegsDescription?: string;

  /** The legs of a combined contract definition. */
  comboLegs?: ComboLeg[];

  /**
   * Delta and underlying price for Delta-Neutral combo orders.
   * Underlying (STK or FUT), delta and underlying price goes into this attribute.
   */
  deltaNeutralContract?: DeltaNeutralContract;
}

export default Contract;
