import { Contract, SecType } from "./contract";

/**
 * A Future Option Contract
 */
export class Future implements Contract {
  constructor(
    public symbol: string,
    public expiry: string,
    public currency?: string,
    public exchange?: string,
    public multiplier?: number
  ) {
    this.currency = this.currency ?? "USD";
    this.exchange = this.exchange ?? "ONE";
  }

  public secType = SecType.FUT;
}
