import { EventName } from "../../api/data/enum/event-name";
import MIN_SERVER_VER from "../../api/data/enum/min-server-version";
import TickType from "../../api/market/tickType";
import { Decoder } from "../../core/io/decoder";
import { IN_MSG_ID } from "../../core/io/enum/in-msg-id";

describe("Decoder tickOptionComputation", () => {
  test("emits tickAttrib before option computation values", () => {
    const emitEvent = jest.fn();
    const decoder = new Decoder({
      serverVersion: MIN_SERVER_VER.PRICE_BASED_VOLATILITY,
      emitEvent,
      emitError: jest.fn(),
      emitInfo: jest.fn(),
    });

    decoder.enqueueMessage([
      String(IN_MSG_ID.TICK_OPTION_COMPUTATION),
      "1",
      String(TickType.BID_OPTION),
      "1",
      "0.25",
      "0.5",
      "1.5",
      "0.75",
      "0.1",
      "0.2",
      "0.3",
      "100",
    ]);

    decoder.process();

    expect(emitEvent).toHaveBeenCalledWith(
      EventName.tickOptionComputation,
      1,
      TickType.BID_OPTION,
      1,
      0.25,
      0.5,
      1.5,
      0.75,
      0.1,
      0.2,
      0.3,
      100,
    );
  });
});
