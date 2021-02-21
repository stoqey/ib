import { ErrorCode } from "../../api/errorCode";

/**
 * An error on the TWS / IB Gateway API.
 */
export interface IBApiError {
  /** The [[Error]] object. */
  error: Error;

  /** The [[IBApi]] Error Code. */
  code: ErrorCode;

  /**  The request id that caused the error, or -1. */
  reqId: number;
}
