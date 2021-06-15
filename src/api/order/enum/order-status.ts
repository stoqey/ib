/**
 * Order status.
 */
export enum OrderStatus {
  ApiPending = "ApiPending",
  ApiCancelled = "ApiCancelled",
  PreSubmitted = "PreSubmitted",
  PendingCancel = "PendingCancel",
  Cancelled = "Cancelled",
  Submitted = "Submitted",
  Filled = "Filled",
  Inactive = "Inactive",
  PendingSubmit = "PendingSubmit",
  Unknown = "Unknown",
}

export default OrderStatus;
