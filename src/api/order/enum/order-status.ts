/**
 * Order status.
 */
export enum OrderStatus{
    API_PENDING = "ApiPending",
    API_CANCELLED = "ApiCancelled",
    PRE_SUBMITTED = "PreSubmitted",
    PENDING_CANCEL = "PendingCancel",
    CANCELLED = "Cancelled",
    SUBMITTED = "Submitted",
    FILLED = "Filled",
    INACTIVE = "Inactive",
    PENDING_SUBMIT = "PendingSubmit",
    UNKNOWN = "Unknown"
}

export default OrderStatus;
