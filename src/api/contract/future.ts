import SecType from "../data/enum/sec-type";
import { Contract } from "./contract";

/**
 * A Future Contract
 */
export class Future implements Contract {
  constructor(
    public symbol: string,
    public localSymbol: string,
    public lastTradeDateOrContractMonth: string,
    public exchange: string,
    public multiplier: number,
    public currency?: string,
  ) {
    this.currency = this.currency ?? "USD";
  }

  public secType = SecType.FUT;
}

export default Future;
