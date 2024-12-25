import OptionType from "../data/enum/option-type";
import SecType from "../data/enum/sec-type";
import { Contract } from "./contract";

/**
 * A Future Option Contract
 */
export class FOP implements Contract {
  constructor(
    public symbol: string,
    public expiry: string,
    public strike: number,
    public right: OptionType,
    public multiplier?: number,
    public exchange?: string,
    public currency?: string,
  ) {
    this.currency = this.currency ?? "USD";
    this.exchange = this.exchange ?? "GLOBEX";
    this.multiplier = this.multiplier ?? 50;
  }

  public secType = SecType.FOP;
}

export default FOP;
