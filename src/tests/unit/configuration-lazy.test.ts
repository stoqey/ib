/**
 * @jest-environment node
 */

describe("configuration lazy loading", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.unmock("fs");
  });

  test("does not read config files when imported", async () => {
    const readFileSync = jest.fn(() => "{}");
    jest.doMock("fs", () => ({ readFileSync }));

    await import("../../common/configuration");

    expect(readFileSync).not.toHaveBeenCalled();
  });

  test("loads config files when a value is read", async () => {
    const readFileSync = jest.fn(() => "{}");
    jest.doMock("fs", () => ({ readFileSync }));

    const { default: configuration } = await import(
      "../../common/configuration"
    );
    const environment = configuration.environment;

    expect(environment).toEqual(process.env.NODE_ENV || "local");
    expect(readFileSync).toHaveBeenCalled();
  });
});
