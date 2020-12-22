
/**
 * @internal
 *
 * The I/O code configuration.
 */
export class Config {

  /** Default TWS / IB Gateway hostname. */
  static readonly DEFAULT_HOST = "127.0.0.1";

  /** Default TWS / IB Gateway port number.*/
  static readonly DEFAULT_PORT = 7496;

  /** Default client id. */
  static readonly DEFAULT_CLIENT_ID = 0;

  /** The version of this API client implementation  */
  static readonly CLIENT_VERSION = 66;

  /** Maximum of requests send per second. */
  static readonly MAX_REQ_PER_SECOND = 40;

}
