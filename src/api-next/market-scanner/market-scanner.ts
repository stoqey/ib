import ContractDetails from "../../api/contract/contractDetails";
import { ItemListUpdate } from "../common/item-list-update";

export type MarketScannerItemRank = number;

export type MarketScannerItem = {
  rank: MarketScannerItemRank;
  contract: ContractDetails;
  distance: string;
  benchmark: string;
  projection: string;
  legStr: string;
};

export type MarketScannerRows = Map<MarketScannerItemRank, MarketScannerItem>;

export type MarketScannerUpdate = ItemListUpdate<MarketScannerRows>;

// for backward compatibility. Type moved to `api`
export {
  Instrument,
  LocationCode,
  ScanCode,
} from "../../api/market-scanner/market-scanner";
