import {
  CurrencyCode,
  AccountId,
  AccountSummaries,
  AccountSummaryValue,
  AccountSummaryValues,
  AccountSummaryTagName,
  AccountSummaryTagValues,
  AccountSummariesUpdate,
} from "../../../";
import { IBApiNextMap } from "../../../internal/map";
import { IBApiNextDataUpdate } from "../../data-update";

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
  extends IBApiNextDataUpdate<MutableAccountSummaries>
  implements AccountSummariesUpdate {}
