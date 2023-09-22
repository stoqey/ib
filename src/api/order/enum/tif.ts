/**
 * Time in Force.
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
