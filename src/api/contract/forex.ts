import { Contract, SecType } from "./contract";

/**
 * A Forex Contract.
 */
export class Forex implements Contract {

  /**
   * Between two currencies,
   * whatever currency comes first should be in "symbol" and the other one must be in "currency".
   */
  private static readonly CURRENCY_SYMBOL_PRIO = [
    "KRW", "EUR", "GBP", "AUD",
    "USD", "TRY", "ZAR", "CAD",
    "CHF", "MXN", "HKD", "JPY",
    "INR", "NOK", "SEK", "RUB"
  ];

  constructor(
    public symbol: string,
    public currency: string) {

    // Swap between symbol and currency if the ordering is incorrect.

    let temp;
    if (Forex.CURRENCY_SYMBOL_PRIO.indexOf(symbol) > Forex.CURRENCY_SYMBOL_PRIO.indexOf(currency)) {
      temp = symbol;
      symbol = currency;
      currency = temp;
    }
  }

  public exchange = "IDEALPRO";
  public secType = SecType.FOP;
}
