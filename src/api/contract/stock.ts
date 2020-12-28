import { Contract, SecType } from "./contract";

/**
 * Stock contract.
 */
export class Stock implements Contract {

  constructor(
    public symbol: string,
    public exchange?: string,
    public currency?: string) {
      this.currency = this.currency??"USD";
      this.exchange = this.exchange??"SMART";
  }

  public secType = SecType.STK;
}

