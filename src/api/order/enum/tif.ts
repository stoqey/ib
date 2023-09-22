/**
 * The time in force.
 *
 * Valid values are:
 * DAY - Valid for the day only.
 * GTC - Good until canceled. The order will continue to work within the system and in the marketplace until it executes or is canceled. GTC orders will be automatically be cancelled under the following conditions:
 * If a corporate action on a security results in a stock split (forward or reverse), exchange for shares, or distribution of shares. If you do not log into your IB account for 90 days.
 * At the end of the calendar quarter following the current quarter. For example, an order placed during the third quarter of 2011 will be canceled at the end of the first quarter of 2012. If the last day is a non-trading day, the cancellation will occur at the close of the final trading day of that quarter. For example, if the last day of the quarter is Sunday, the orders will be cancelled on the preceding Friday.
 * Orders that are modified will be assigned a new “Auto Expire” date consistent with the end of the calendar quarter following the current quarter.
 * Orders submitted to IB that remain in force for more than one day will not be reduced for dividends. To allow adjustment to your order price on ex-dividend date, consider using a Good-Til-Date/Time (GTD) or Good-after-Time/Date (GAT) order type, or a combination of the two.
 * IOC - Immediate or Cancel. Any portion that is not filled as soon as it becomes available in the market is canceled.
 * GTD - Good until Date. It will remain working within the system and in the marketplace until it executes or until the close of the market on the date specified
 * OPG - Use OPG to send a market-on-open (MOO) or limit-on-open (LOO) order.
 * FOK - If the entire Fill-or-Kill order does not execute as soon as it becomes available, the entire order is canceled.
 * DTC - Day until Canceled.
 */

export const TimeInForce = {
  DAY: "DAY",
  GTC: "GTC",
  OPG: "OPG",
  IOC: "IOC",
  GTD: "GTD",
  GTT: "GTT",
  AUC: "AUC",
  FOK: "FOK",
  GTX: "GTX",
  DTC: "DTC",
  Minutes: "Minutes",
} as const;
export type TimeInForce = (typeof TimeInForce)[keyof typeof TimeInForce];
