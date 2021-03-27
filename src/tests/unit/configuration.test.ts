/**
 * @jest-environment ./src/tests/nodb-test-environment
 */

import configuration from "../../core/utils/configuration";

describe("configuration", () => {
  test("ENV vars take priority", async () => {
    expect(configuration.env_config_test).toEqual("ENV");
  });

  test("ENV vars must be specified in includes array", async () => {
    expect(configuration.env_not_included_config_test).toEqual("default");
  });

  test("environment specific files take priority over local", async () => {
    const env = configuration.ci ? "development" : "test";
    expect(configuration.environment_config_test).toEqual(env);
  });

  test("local takes priority over default", async () => {
    if (!configuration.ci) {
      expect(configuration.local_config_test).toEqual("local");
    }
  });

  test("default is lowest priority", async () => {
    expect(configuration.default_config_test).toEqual("default");
  });
});
