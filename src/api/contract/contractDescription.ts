import { Contract, SecType } from "./contract";

/**
 * A container for storing Soft Dollar Tier information.
 */
export interface ContractDescription {
  /** The underlying contract. */
  contract?: Contract;

  /** Array of derivative security types. */
  derivativeSecTypes?: SecType[];
}
