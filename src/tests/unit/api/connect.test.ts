import { IBApi } from "../../../api/api";
import { EventName } from "../../../api/data/enum/event-name";
import configuration from "../../../common/configuration";
import logger from "../../../common/logger";

describe("IBApi Tests", () => {
  jest.setTimeout(30000);
  let _clientId = 0; // ensure unique client

  let ib: IBApi;

  beforeEach(async () => {
    ib = new IBApi({
      clientId: _clientId++,
      host: configuration.ib_host,
      port: configuration.ib_port,
    });
  });

  afterEach(async () => {
    if (ib) {
      ib.disconnect();
    }
  });

  it("Test connect / disconnect", () => {
    ib.on(EventName.connected, () => {
      logger.info("successful Login");
    }).on(EventName.error, (err, code, id) => {
      logger.error(err);
      expect(`${err.message} - code: ${code} - id: ${id}`).toBeTruthy();
    });

    ib.connect();
  });

  test("Disconnect", () => {
    ib.on(EventName.disconnected, () => {
      expect(ib).toBeFalsy();
    });

    ib.connect();
  });
});
