import {
  TickType,
  MarketDataTick,
  MarketDataTicks,
  MarketDataUpdate,
} from "../../..";
import { IBApiNextDataUpdate } from "../../data-update";
import { IBApiNextMap } from "../../map";

/** Mutable version of [[AccountSummary]] */
export class MutableMarketData
  extends IBApiNextMap<TickType, MarketDataTick>
  implements MarketDataTicks {}

/** Mutable version of [[AccountSummariesUpdate]] */
export class MutableMarketDataUpdate
  extends IBApiNextDataUpdate<MutableMarketData>
  implements MarketDataUpdate {}
