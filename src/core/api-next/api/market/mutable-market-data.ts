import { TickType } from "../../../..";
import {
  MarketDataTick,
  MarketDataTicks,
  MarketDataUpdate,
} from "../../../../api-next";
import { IBApiNextItemListUpdate } from "../../item-list-update";
import { IBApiNextMap } from "../../map";

/** Mutable version of [[AccountSummary]] */
export class MutableMarketData
  extends IBApiNextMap<TickType, MarketDataTick>
  implements MarketDataTicks {}

/** Mutable version of [[AccountSummariesUpdate]] */
export class MutableMarketDataUpdate
  extends IBApiNextItemListUpdate<MutableMarketData>
  implements MarketDataUpdate {}
