/**
 * Security Definition Option Parameter details.
 */
export interface SecurityDefinitionOptionParameterType {
  /** The destination exchange. */
  exchange: string;

  /** The contract ID (conID) of the underlying instrument. */
  underlyingConId: number;

  /** The underlying asset (local?) symbol. */
  tradingClass: string;

  /** The instrument's multiplier (i.e. options, futures). */
  multiplier: number;

  /** The list of options' available expiration dates. */
  expirations: string[];

  /** The list of options' available strikes. */
  strikes: number[];
}

export default SecurityDefinitionOptionParameterType;
