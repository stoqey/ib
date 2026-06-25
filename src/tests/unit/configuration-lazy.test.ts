/**
 * @jest-environment node
 */

describe("configuration lazy loading", () => {
  const envConfigTest = process.env.ENV_CONFIG_TEST;

  afterEach(() => {
    if (envConfigTest === undefined) {
      delete process.env.ENV_CONFIG_TEST;
    } else {
      process.env.ENV_CONFIG_TEST = envConfigTest;
    }
    jest.resetModules();
    jest.clearAllMocks();
    jest.unmock("fs");
    jest.unmock("dotenv");
  });

  test("does not read config files when imported", async () => {
    const readFileSync = jest.fn(() => "{}");
    const config = jest.fn();
    jest.doMock("fs", () => ({ readFileSync }));
    jest.doMock("dotenv", () => ({ config }));

    await import("../../common/configuration");

    expect(readFileSync).not.toHaveBeenCalled();
    expect(config).not.toHaveBeenCalled();
  });

  test("does not load configuration when the package root is imported", async () => {
    const readFileSync = jest.fn(() => "{}");
    const config = jest.fn();
    jest.doMock("fs", () => ({ readFileSync }));
    jest.doMock("dotenv", () => ({ config }));

    await import("../..");

    expect(readFileSync).not.toHaveBeenCalled();
    expect(config).not.toHaveBeenCalled();
  });

  test("loads config files when a value is read", async () => {
    const readFileSync = jest.fn(() => "{}");
    const config = jest.fn();
    jest.doMock("fs", () => ({ readFileSync }));
    jest.doMock("dotenv", () => ({ config }));

    const { default: configuration } = await import(
      "../../common/configuration"
    );
    const environment = configuration.environment;

    expect(environment).toEqual(process.env.NODE_ENV || "local");
    expect(readFileSync).toHaveBeenCalled();
    expect(config).toHaveBeenCalledWith({ quiet: true });
  });

  test("loads dotenv before applying environment overrides", async () => {
    delete process.env.ENV_CONFIG_TEST;

    const readFileSync = jest.fn(() => "{}");
    const config = jest.fn(() => {
      process.env.ENV_CONFIG_TEST = "DOTENV";
      return {};
    });
    jest.doMock("fs", () => ({ readFileSync }));
    jest.doMock("dotenv", () => ({ config }));

    const { default: configuration } = await import(
      "../../common/configuration"
    );

    expect(configuration.env_config_test).toEqual("DOTENV");
    expect(config).toHaveBeenCalledTimes(1);
    expect(config).toHaveBeenCalledWith({ quiet: true });
  });
});
