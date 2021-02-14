/**
 * A container for storing Soft Dollar Tier information.
 */
export interface SoftDollarTier {
  /** The name of the Soft Dollar Tier. */
  name?: string;

  /**	The value of the Soft Dollar Tier. */
  value?: string;

  /** The display name of the Soft Dollar Tier. */
  displayName: string;
}

export default SoftDollarTier;
