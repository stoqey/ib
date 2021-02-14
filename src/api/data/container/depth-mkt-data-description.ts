import { SecType } from "../enum/sec-type";

/**
 * A container for storing Family Code information.
 */
export interface DepthMktDataDescription {
  /** The exchange code. */
  exchange?: string;

  /** The security type. */
  secType?: SecType;

  /** TODO: document */
  listingExch?: string;

  /** TODO: document */
  serviceDataType?: string;

  /** TODO: document */
  aggGroup?: number;
}
