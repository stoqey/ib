import { EventName } from "../../../../api/data/enum/event-name";
import MIN_SERVER_VER from "../../../../api/data/enum/min-server-version";
import { Decoder } from "../../../../core/io/decoder";
import { IN_MSG_ID } from "../../../../core/io/enum/in-msg-id";

describe("Decoder securityDefinitionOptionParameter", () => {
  test("preserves zero-valued strikes", () => {
    const emitEvent = jest.fn();
    const decoder = new Decoder({
      serverVersion: MIN_SERVER_VER.SEC_DEF_OPT_PARAMS_REQ,
      emitEvent,
      emitError: jest.fn(),
      emitInfo: jest.fn(),
    });

    decoder.enqueueMessage([
      String(IN_MSG_ID.SECURITY_DEFINITION_OPTION_PARAMETER),
      "42",
      "SMART",
      "12345",
      "SPX",
      "100",
      "1",
      "20260717",
      "2",
      "0",
      "12.5",
    ]);

    decoder.process();

    expect(emitEvent).toHaveBeenCalledWith(
      EventName.securityDefinitionOptionParameter,
      42,
      "SMART",
      12345,
      "SPX",
      100,
      ["20260717"],
      [0, 12.5],
    );
  });
});
