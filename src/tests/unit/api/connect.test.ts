import { IBApi } from "../../../api/api";
import { EventName } from "../../../api/data/enum/event-name";
import configuration from "../../../common/configuration";
import logger from "../../../common/logger";

const TEST_SERVER_HOST = configuration.ib_host;
const TEST_SERVER_PORT = configuration.ib_port;

describe("IBApi Tests", () => {
  jest.setTimeout(10000);
  let _clientId = Math.floor(Math.random() * 32766) + 1; // ensure unique client

  // let ib: IBApi;

  // beforeEach(async () => {
  //   ib = new IBApi({
  //     clientId: _clientId++,
  //     host: configuration.ib_host,
  //     port: configuration.ib_port,
  //   });
  // });

  // afterEach(async () => {
  //   if (ib) {
  //     ib.disconnect();
  //   }
  // });

  it("Test connect / disconnect", (done) => {
    const ib = new IBApi({
      host: TEST_SERVER_HOST,
      port: TEST_SERVER_PORT,
    });

    ib.on(EventName.connected, () => {
      ib.reqCurrentTime();
    })
      .on(EventName.currentTime, (time) => {
        expect(time).toBeTruthy();
        ib.disconnect();
      })
      .on(EventName.disconnected, () => {
        done();
      })
      .on(EventName.error, (err, code, id) => {
        logger.error(err);
        done(`${err.message} - code: ${code} - id: ${id}`);
      });

    ib.connect(_clientId++);
  });

  // Removed as:
  // - expect(ib).toBeFalsy() throws a Jest exception
  // - it's already included in above test
  // test("Disconnect", () => {
  //   ib.on(EventName.connected, () => {
  //     ib.disconnect();
  //   }).on(EventName.disconnected, () => {
  //     expect(ib).toBeFalsy();
  //   });

  //   ib.connect();
  // });
});
