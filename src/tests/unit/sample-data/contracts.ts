/**
 * This file describe sample contracts to be used in various tests code.
 */
import {
  Bond,
  Contract,
  Future,
  Index,
  Option,
  OptionType,
  SecType,
  Stock,
} from "../../..";
import Crypto from "../../../api/contract/crypto";

export const sample_stock: Contract = new Stock("AAPL");
export const aapl_contract: Contract = {
  conId: 265598,
  secType: SecType.STK,
  symbol: "AAPL",
  exchange: "SMART",
  currency: "USD",
};
export const sample_etf: Contract = new Stock("SPY");
export const sample_future: Contract = new Future(
  "ES",
  "ESH4",
  "202403",
  "CME",
  50,
);
export const sample_option: Contract = new Option(
  "AAPL",
  "20251219",
  200,
  OptionType.Put,
);
export const sample_bond: Contract = new Bond("US279158AE95");
export const sample_index: Contract = new Index("ES", "USD");
export const sample_dax_index: Contract = new Index("DAX", "EUR", "EUREX");
export const sample_crypto: Contract = new Crypto("ETH");
