import {
  AccountId,
  Position,
  AccountPositions,
  AccountPositionsUpdate,
} from "../../../../api-next";
import { IBApiNextMap } from "../../map";
import { IBApiNextDataUpdate } from "../../data-update";

/** Mutable version of [[AccountPositions]] */
export class MutableAccountPositions
  extends IBApiNextMap<AccountId, Position[]>
  implements AccountPositions {}

/** Mutable version of [[AccountPositionsUpdate]] */
export class MutableAccountPositionsUpdate
  extends IBApiNextDataUpdate<MutableAccountPositions>
  implements AccountPositionsUpdate {}
