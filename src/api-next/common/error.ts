import { ErrorCode } from "../..";

/**
 * An error on the TWS / IB Gateway API or IBApiNext.
 */
export class IBApiNextError extends Error {
  /** The [[Error]] object. */
  public readonly error: Error;

  /** The [[IBApi]] Error Code. */
  public readonly code: ErrorCode;

  /**  The request id that caused the error, or -1. */
  public readonly reqId: number;

  /** Additional information in case of order rejection */
  public readonly advancedOrderReject?: unknown;

  constructor(
    error: Error,
    code: ErrorCode,
    reqId: number = ErrorCode.NO_VALID_ID,
    advancedOrderReject?: unknown,
  ) {
    super(error.message); // Call the parent constructor
    this.name = "IBApiNextError"; // Set the error name
    Object.setPrototypeOf(this, IBApiNextError.prototype); // Ensure correct prototype chain

    this.error = error;
    this.code = code;
    this.reqId = reqId;
    this.advancedOrderReject = advancedOrderReject;
  }
}
