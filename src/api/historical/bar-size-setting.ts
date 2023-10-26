/**
 * Allowed bar size settings for historical market data:
 * https://interactivebrokers.github.io/tws-api/historical_bars.html
 */
export enum BarSizeSetting {
  SECONDS_ONE = "1 secs",
  SECONDS_FIVE = "5 secs",
  SECONDS_TEN = "10 secs",
  SECONDS_FIFTEEN = "15 secs",
  SECONDS_THIRTY = "30 secs",
  MINUTES_ONE = "1 min",
  MINUTES_TWO = "2 mins",
  MINUTES_THREE = "3 mins",
  MINUTES_FIVE = "5 mins",
  MINUTES_TEN = "10 mins",
  MINUTES_FIFTEEN = "15 mins",
  MINUTES_TWENTY = "20 mins",
  MINUTES_THIRTY = "30 mins",
  HOURS_ONE = "1 hour",
  HOURS_TWO = "2 hours",
  HOURS_THREE = "3 hours",
  HOURS_FOUR = "4 hours",
  HOURS_EIGHT = "8 hours",
  DAYS_ONE = "1 day",
  WEEKS_ONE = "1 week", // "1W" or "1 week"?
  MONTHS_ONE = "1 month", // "1M" or "1 month"?
}

export default BarSizeSetting;
