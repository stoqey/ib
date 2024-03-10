import SecType from "../data/enum/sec-type";
import { Contract } from "./contract";

/**
 * Crypto contract.
 */
export class Crypto implements Contract {
  constructor(
    public symbol: string,
    public exchange?: string,
    public currency?: string,
  ) {
    this.currency = this.currency ?? "USD";
    this.exchange = this.exchange ?? "PAXOS";
  }

  public secType = SecType.CRYPTO;
}

export default Crypto;
