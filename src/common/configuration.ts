/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-var-requires */
import { readFileSync } from "fs";
import * as path from "path";

require("dotenv").config();

export interface Configuration {
  ci: string;
  env_config_test: string;
  env_not_included_config_test: string;
  default_config_test: string;
  local_config_test: string;
  environment_config_test: string;
  // Test env config
  ib_test_port: number;
  ib_test_host: string;

  // package config
  ib_host: string;
  ib_port: number;
  default_client_id: number;
  client_version: number;
  max_req_per_second: number;

  environment: string;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  isLocal: boolean;
}

let configuration: Configuration = null;

const envsToInclude = ["ci", "env_config_test", "ib_host", "ib_port", "max_req_per_second", "client_version", "default_client_id" ];

function readJson(readPath: string) {
  try {
    const data = readFileSync(readPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (
      error.code !== "ENOENT" ||
      (error.errno !== -4058 && error.errno !== -2)
    ) {
      throw error;
    }
  }
  return {};
}

function read(file: string): Configuration {
  const filePath = path.resolve(
    __dirname,
    "..",
    "..",
    "config",
    `${file}.json`
  );
  return readJson(filePath);
}

function assignEnvironment(config: any) {
  const newConfig = config;
  envsToInclude.forEach((key) => {
    const lc = key.toLowerCase();
    const uc = key.toUpperCase();
    newConfig[lc] = process.env[uc] || config[lc];
  });
  return newConfig;
}

function loadEnvironmentSpecific(config: Configuration, environment: string) {
  let newConfig = config;
  if (environment) {
    const conf = read(environment);
    if (conf) {
      newConfig = {
        ...newConfig,
        ...conf,
      };
    }
  }
  return newConfig;
}

const ensureInteger = (
  fields: (keyof Configuration)[],
  config: Configuration
) =>
  fields.forEach((field) => {
    const value = config[field];
    if (typeof value === "string") {
      config[field] = parseInt(value, 10) as never;
    }
  });

const isTrue = (value: any) =>
  [true, "true", "1", "True", "yes", "Yes"].indexOf(value) > -1;

function load() {
  const nodeEnvironment = process.env.NODE_ENV;

  // load default config
  let config = read("default");

  // load local config
  config = loadEnvironmentSpecific(config, "local");

  // load environment specific config
  config = loadEnvironmentSpecific(config, nodeEnvironment);

  // load config from env variables
  config = assignEnvironment(config);

  config.environment = nodeEnvironment || "local";
  config.isProduction = nodeEnvironment === "production";
  config.isStaging = nodeEnvironment === "staging";
  config.isDevelopment = nodeEnvironment === "development";
  config.isTest = nodeEnvironment === "test";
  config.isLocal = !nodeEnvironment;

  config.ci = config.ci || process.env.CIRCLECI;

  const intFields: (keyof Configuration)[] = [
    "ib_test_port",
    "ib_port",
    "default_client_id",
    "client_version",
    "max_req_per_second",
  ];
  ensureInteger(intFields, config);

  return config;
}

export function get() {
  if (!configuration) {
    configuration = load();
  }
  return configuration;
}

if (!configuration) {
  configuration = load();
}

export default configuration;
