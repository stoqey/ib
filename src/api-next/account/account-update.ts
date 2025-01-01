import { ItemListUpdate } from "../..";
import { MutableAccountSummaries } from "../../core/api-next/api/account/mutable-account-summary";
import { MutableAccountPositions } from "../../core/api-next/api/position/mutable-account-positions-update";

export interface AccountUpdate {
  timestamp?: string;
  portfolio?: MutableAccountPositions;
  value?: MutableAccountSummaries;
}

/** An update on the account summaries. */
export type AccountUpdatesUpdate = ItemListUpdate<AccountUpdate>;
