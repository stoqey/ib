import { MAX_SUPPORTED_SERVER_VERSION } from "../../../../api/api";
import { EventName } from "../../../../api/data/enum/event-name";
import { TickType } from "../../../../api/market/tickType";
import { Decoder } from "../../../../core/io/decoder";
import { IN_MSG_ID } from "../../../../core/io/enum/in-msg-id";

describe("Decoder fractional tick sizes", () => {
  test.each([TickType.LAST_SIZE, TickType.DELAYED_LAST_SIZE])(
    "preserves fractional tickSize values for tick type %i",
    (tickType) => {
      const emitEvent = jest.fn();
      const emitError = jest.fn();
      const decoder = new Decoder({
        serverVersion: MAX_SUPPORTED_SERVER_VERSION,
        emitEvent,
        emitError,
        emitInfo: jest.fn(),
      });
      decoder.enqueueMessage([
        String(IN_MSG_ID.TICK_SIZE),
        "1",
        "42",
        String(tickType),
        "0.125",
      ]);

      decoder.process();

      expect(emitEvent).toHaveBeenCalledWith(
        EventName.tickSize,
        42,
        tickType,
        0.125,
      );
      expect(emitError).not.toHaveBeenCalled();
    },
  );
});
