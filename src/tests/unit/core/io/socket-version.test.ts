import { EventEmitter } from "events";
import net from "net";

import { MAX_SUPPORTED_SERVER_VERSION } from "../../../../api/api";
import { EventName } from "../../../../api/data/enum/event-name";
import { ErrorCode } from "../../../../common/errorCode";
import { Controller } from "../../../../core/io/controller";
import { OUT_MSG_ID } from "../../../../core/io/encoder";
import { Socket } from "../../../../core/io/socket";

describe("Socket protocol version negotiation", () => {
  let socket: Socket;
  let tcp: EventEmitter & {
    write: jest.Mock;
    end: jest.Mock;
    destroy: jest.Mock;
  };
  let onConnect: () => void;
  let controller: {
    pause: jest.Mock;
    resume: jest.Mock;
    emitEvent: jest.Mock;
    emitError: jest.Mock;
    onMessage: jest.Mock;
    processIngressQueue: jest.Mock;
  };

  beforeEach(() => {
    tcp = Object.assign(new EventEmitter(), {
      write: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    });
    jest.spyOn(net, "connect").mockImplementation((...args: unknown[]) => {
      onConnect = args[1] as () => void;
      return tcp as unknown as net.Socket;
    });
    controller = {
      pause: jest.fn(),
      resume: jest.fn(),
      emitEvent: jest.fn(),
      emitError: jest.fn(),
      onMessage: jest.fn(),
      processIngressQueue: jest.fn(),
    };
    socket = new Socket(controller as unknown as Controller, {
      host: "127.0.0.1",
      port: 4002,
    });
    socket.connect(7);
    onConnect();
  });

  afterEach(() => {
    socket.disconnect();
    tcp.removeAllListeners();
    jest.restoreAllMocks();
  });

  function frame(tokens: string[]): Buffer {
    const payload = Buffer.from(`${tokens.join("\0")}\0`);
    const header = Buffer.alloc(4);
    header.writeInt32BE(payload.length);
    return Buffer.concat([header, payload]);
  }

  test("advertises only the implemented protocol range", () => {
    const handshake = tcp.write.mock.calls[0][0] as Buffer;
    expect(MAX_SUPPORTED_SERVER_VERSION).toBe(193);
    expect(handshake.subarray(0, 4).toString()).toBe("API\0");
    expect(handshake.readInt32BE(4)).toBe(9);
    expect(handshake.subarray(8).toString()).toBe("v100..193");
  });

  test.each([100, 178, 193])(
    "starts the API at negotiated protocol %i",
    (version) => {
      const connectionTime = "20261026 12:00:00 UTC";
      tcp.emit("data", frame([String(version), connectionTime]));

      expect(socket.connected).toBe(true);
      expect(socket.serverVersion).toBe(version);
      expect(controller.emitError).not.toHaveBeenCalled();
      expect(controller.emitEvent).toHaveBeenCalledWith(EventName.connected);
      expect(controller.emitEvent).toHaveBeenCalledWith(
        EventName.server,
        version,
        connectionTime,
      );
      const startAPI = tcp.write.mock.calls[1][0] as Buffer;
      expect(startAPI.subarray(4).toString()).toBe(
        `${OUT_MSG_ID.START_API}\0${2}\0${7}\0\0`,
      );
    },
  );

  test("handles a fragmented handshake followed by a message in the same chunk", () => {
    const handshake = frame(["193", "20261026 12:00:00 UTC"]);
    const message = ["9", "1", "42"];
    tcp.emit("data", handshake.subarray(0, 3));
    expect(socket.connected).toBe(false);

    tcp.emit("data", Buffer.concat([handshake.subarray(3), frame(message)]));

    expect(socket.connected).toBe(true);
    expect(controller.onMessage).toHaveBeenCalledWith(message);
    expect(controller.processIngressQueue).toHaveBeenCalledTimes(1);
    expect(controller.emitError).not.toHaveBeenCalled();
  });

  test.each([99, 194])(
    "rejects negotiated protocol %i outside the advertised range",
    (version) => {
      tcp.emit("data", frame([String(version), "20261026 12:00:00 UTC"]));

      expect(socket.connected).toBe(false);
      expect(controller.emitError).toHaveBeenCalledWith(
        `Unsupported Version ${version}`,
        ErrorCode.UNSUPPORTED_VERSION,
      );
      expect(controller.emitEvent).not.toHaveBeenCalledWith(
        EventName.connected,
      );
      expect(tcp.write).toHaveBeenCalledTimes(1);
      expect(tcp.end).toHaveBeenCalledTimes(1);
      expect(tcp.destroy).toHaveBeenCalledTimes(1);
    },
  );
});
