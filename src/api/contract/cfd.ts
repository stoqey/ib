import { Contract, SecType } from "./contract";

/**
 * A CFD contract.
 */
export class CFD implements Contract {

  constructor(
    public symbol: string,
    public currency?: string,
    public exchange?: string) {
      this.currency = this.currency??"USD";
      this.exchange = this.exchange??"SMART";
  }

  public secType = SecType.STK;
}
