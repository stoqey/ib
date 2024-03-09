import {
  ConjunctionConnection,
  ExecutionCondition,
  MarginCondition,
  OrderCondition,
  PercentChangeCondition,
  PriceCondition,
  TimeCondition,
  TriggerMethod,
  VolumeCondition,
} from "../../..";
import { aapl_contract, sample_stock } from "./contracts";

export const sample_price_condition: OrderCondition = new PriceCondition(
  29,
  TriggerMethod.Default,
  aapl_contract.conId,
  aapl_contract.exchange,
  true,
  ConjunctionConnection.OR,
);
export const sample_execution_condition: OrderCondition =
  new ExecutionCondition(
    sample_stock.exchange,
    sample_stock.secType,
    sample_stock.symbol,
    ConjunctionConnection.OR,
  );
export const sample_margin_condition: OrderCondition = new MarginCondition(
  10,
  false,
  ConjunctionConnection.OR,
);
export const sample_percent_condition: OrderCondition =
  new PercentChangeCondition(
    0.1,
    aapl_contract.conId,
    aapl_contract.exchange,
    true,
    ConjunctionConnection.OR,
  );
export const sample_time_condition: OrderCondition = new TimeCondition(
  "20250101-12:00:00",
  true,
  ConjunctionConnection.OR,
);
export const sample_volume_condition: OrderCondition = new VolumeCondition(
  100,
  aapl_contract.conId,
  aapl_contract.exchange,
  true,
  ConjunctionConnection.OR,
);
