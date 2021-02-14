import SecType from "../data/enum/sec-type";
import { Contract } from "./contract";

/**
 * A Combo contract.
 */
export class Combo implements Contract {
  constructor(
    public symbol: string,
    public currency?: string,
    public exchange?: string
  ) {
    this.currency = this.currency ?? "USD";
    this.exchange = this.exchange ?? "SMART";
  }

  public secType = SecType.BAG;
}

export default Combo;
