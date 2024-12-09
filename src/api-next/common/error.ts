import { ErrorCode } from "../..";

/**
 * An error on the TWS / IB Gateway API or IBApiNext.
 */
export interface IBApiNextError {
  /** The [[Error]] object. */
  error: Error;

  /** The [[IBApi]] Error Code. */
  code: ErrorCode;

  /**  The request id that caused the error, or -1. */
  reqId: number;

  /** Additional information in case of order rejection */
  advancedOrderReject?: unknown;

  /** Warning/information only message, not an error */
  // isWarning: boolean;
}
