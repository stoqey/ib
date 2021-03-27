import {
  CurrencyCode,
  AccountId,
  AccountSummaries,
  AccountSummaryValue,
  AccountSummaryValues,
  AccountSummaryTagName,
  AccountSummaryTagValues,
  AccountSummariesUpdate,
} from "../../../../api-next";
import { IBApiNextMap } from "../../map";
import { IBApiNextItemListUpdate } from "../../item-list-update";

/** Mutable version of [[AccountSummaryValues]] */
export class MutableAccountSummaryValues
  extends IBApiNextMap<CurrencyCode, AccountSummaryValue>
  implements AccountSummaryValues {}

/** Mutable version of [[AccountSummaryTagValues]] */
export class MutableAccountSummaryTagValues
  extends IBApiNextMap<AccountSummaryTagName, MutableAccountSummaryValues>
  implements AccountSummaryTagValues {}

/** Mutable version of [[AccountSummary]] */
export class MutableAccountSummaries
  extends IBApiNextMap<AccountId, MutableAccountSummaryTagValues>
  implements AccountSummaries {}

/** Mutable version of [[AccountSummariesUpdate]] */
export class MutableAccountSummariesUpdate
  extends IBApiNextItemListUpdate<MutableAccountSummaries>
  implements AccountSummariesUpdate {}
