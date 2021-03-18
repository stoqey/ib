/**
 * Status of the connection to TWS / IB Gateway.
 */
export enum ConnectionState {
  /** Disconnected from TWS / IB Gateway. */
  Disconnected,

  /** Current connecting to TWS / IB Gateway. */
  Connecting,

  /** Connected to TWS / IB Gateway. */
  Connected,
}
