import ScannerSubscription from "../../api/market/scannerSubscription";
import { ItemListUpdate } from "../common/item-list-update";

export type MarketScannerUpdate = ItemListUpdate<ScannerSubscription>;
