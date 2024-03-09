import SecType from "../data/enum/sec-type";
import { Contract } from "./contract";

/**
 * Crypto contract.
 */
export class Crypto implements Contract {
  constructor(public symbol: string) {}

  public currency = "USD";
  public exchange = "PAXOS";
  public secType = SecType.CRYPTO;
}

export default Crypto;
