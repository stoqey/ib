/**
 * [[PriceCondition]] trigger method.
 */
export enum TriggerMethod {
  Default = 0,
  DoubleBidAsk = 1,
  Last = 2,
  DoubleLast = 3,
  BidAsk = 4,
  LastOfBidAsk = 7,
  MidPoint = 8,
}

export default TriggerMethod;
