import SecType from "../data/enum/sec-type";
import { Contract } from "./contract";

/**
 * A Bond Contract
 */
export class Bond implements Contract {
  constructor(
    public symbol: string,
    public maturity?: string,
    public exchange?: string,
    public currency?: string,
  ) {
    this.currency = this.currency ?? "USD";
  }

  public secType = SecType.BOND;

  public get lastTradeDateOrContractMonth(): string {
    return this.maturity;
  }
}

export default Bond;
