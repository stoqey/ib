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
export const sample_etf: Contract = new Stock("SPY");
export const sample_bond: Contract = new Bond("US279158AE95");
export const sample_index: Contract = new Index("ES", "USD");
export const sample_dax_index: Contract = new Index("DAX", "EUR", "EUREX");
export const sample_crypto: Contract = new Crypto("ETH");

// This one will need to be updated sometimes
export const sample_future: Contract = new Future(
  "ES",
  "ESH4",
  "202403",
  "CME",
  50,
);

// This one may need to be updated from times to times
export const sample_option: Contract = new Option(
  "SPY",
  "20260116",
  440,
  OptionType.Call,
);

/*
   Contracts with conId for tests needing IB's conID
*/
export const aapl_contract: Contract = {
  conId: 265598,
  secType: SecType.STK,
  symbol: "AAPL",
  exchange: "SMART",
  currency: "USD",
};
