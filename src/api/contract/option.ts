import OptionType from "../data/enum/option-type";
import SecType from "../data/enum/sec-type";
import { Contract } from "./contract";

/**
 * Option contact.
 */
export class Option implements Contract {
  constructor(
    public symbol: string,
    public expiry: string,
    public strike: number,
    public right: OptionType,
    public exchange?: string,
    public currency?: string,
  ) {
    this.currency = this.currency ?? "USD";
    this.exchange = this.exchange ?? "SMART";
  }

  public secType = SecType.OPT;
  public multiplier = 100;

  public get lastTradeDateOrContractMonth(): string {
    return this.expiry;
  }
}

export default Option;
