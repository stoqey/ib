import { Contract, OptionType, SecType } from "./contract";

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
    public currency?: string
  ) {
    this.currency = this.currency ?? "USD";
    this.exchange = this.exchange ?? "SMART";
  }

  public secType = SecType.OPT;
  public multiplier = 100;
}
