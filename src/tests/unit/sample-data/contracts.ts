/**
 * This file describe sample contracts to be used in various tests code.
 */
import {
  Bond,
  Contract,
  Crypto,
  Future,
  Index,
  Option,
  OptionType,
  SecType,
  Stock,
} from "../../..";

export const sample_stock: Contract = new Stock("AAPL");
export const sample_etf: Contract = new Stock("SPY");
export const sample_bond: Contract = new Bond("US064159KJ44");
export const sample_index: Contract = new Index("ES");
export const sample_dax_index: Contract = new Index("DAX", "EUREX", "EUR");
export const sample_crypto: Contract = new Crypto("BTC");

// This one will need to be updated sometimes
export const sample_future: Contract = new Future(
  "ES",
  "ESZ6",
  "202612",
  "CME",
  50,
);

// This one may need to be updated from times to times
export const sample_option: Contract = new Option(
  "SPY",
  "20281215",
  750,
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
