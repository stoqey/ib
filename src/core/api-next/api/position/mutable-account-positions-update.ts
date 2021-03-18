import {
  AccountId,
  Position,
  AccountPositions,
  AccountPositionsUpdate,
} from "../../../../api-next";
import { IBApiNextMap } from "../../map";
import { IBApiNextItemListUpdate } from "../../item-list-update";

/** Mutable version of [[AccountPositions]] */
export class MutableAccountPositions
  extends IBApiNextMap<AccountId, Position[]>
  implements AccountPositions {}

/** Mutable version of [[AccountPositionsUpdate]] */
export class MutableAccountPositionsUpdate
  extends IBApiNextItemListUpdate<MutableAccountPositions>
  implements AccountPositionsUpdate {}
