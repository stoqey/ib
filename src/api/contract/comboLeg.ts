import OrderAction from "../order/enum/order-action";

/**
 * A leg within combo orders.
 */
export interface ComboLeg {
  /** The Contract's IB's unique id. */
  conId?: number;

  /**
   * Select the relative number of contracts for the leg you are constructing.
   * To help determine the ratio for a specific combination order, refer to the Interactive Analytics section of the User's Guide.
   */
  ratio?: number;

  /**
   * The side (buy or sell) of the leg:
   *
   * - For individual accounts, only BUY and SELL are available. SSHORT is for institutions.
   */
  action?: OrderAction;

  /** The destination exchange to which the order will be routed. */
  exchange?: string;

  /**
   * Specifies whether an order is an open or closing order.
   * For institutional customers to determine if this order is to open or close a position.
   * - 0 - Same as the parent security. This is the only option for retail customers.
   * - 1 - Open. This value is only valid for institutional customers.
   * - 2 - Close. This value is only valid for institutional customers.
   * - 3 - Unknown.
   */
  openClose?: number;

  /**
   * For stock legs when doing short selling.
   * Set to 1 = clearing broker, 2 = third party.
   */
  shortSaleSlot?: number;

  /** When [[shortSaleSlot]] is 2, this field shall contain the designated location. */
  designatedLocation?: string;

  /** TODO document */
  exemptCode?: number;
}

export default ComboLeg;
