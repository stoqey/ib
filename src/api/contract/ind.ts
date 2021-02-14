import SecType from "../data/enum/sec-type";
import { Contract } from "./contract";

/**
 * Index contract.
 */
export class Index implements Contract {
  constructor(
    public symbol: string,
    public expiry: string,
    public currency?: string,
    public exchange?: string,
    public multiplier?: number
  ) {
    this.currency = this.currency ?? "USD";
    this.exchange = this.exchange ?? "CBOE";
  }

  public secType = SecType.IND;
}

export default Index;
