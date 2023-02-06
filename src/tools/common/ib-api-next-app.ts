import colors from "colors";
import { Subscription } from "rxjs";

import { IBApiNext } from "../../api-next";
import LogLevel from "../../api/data/enum/log-level";
import configuration from "../../common/configuration";
import logger from "../../common/logger";

/**
 * @internal
 *
 * JSON replace function to convert ES6 Maps to tuple arrays.
 */
function jsonReplacer(key, value) {
  if (value instanceof Map) {
    const tuples: [unknown, unknown][] = [];
    value.forEach((v, k) => {
      tuples.push([k, v]);
    });
    return tuples;
  } else {
    return value;
  }
}

/**
 * Base-class for the [[IBApiNext]] apps.
 */
export class IBApiNextApp {
  constructor(
    appDescription: string,
    usageDescription: string,
    optionArgumentDescriptions: [string, string][],
    usageExample: string
  ) {
    this.parseCommandLine(
      appDescription,
      usageDescription,
      [...this.COMMON_OPTION_ARGUMENTS, ...optionArgumentDescriptions],
      usageExample
    );
  }

  /** Common command line options of all [[IBApiNext]] apps. */
  private readonly COMMON_OPTION_ARGUMENTS: [string, string][] = [
    ["h", "(or -help) Print the help text."],
    ["log=<log_level>", "Log level. Valid values: error, warn, info, debug."],
    [
      "host=<hostname>",
      "IP or hostname of the TWS or IB Gateway. Default is 127.0.0.1.",
    ],
    ["port=<number>", "Post number of the TWS or IB Gateway. Default is 4002."],
    [
      "watch",
      "Watch for changes. If specified, the app will keep running and print positions updates to console as received from TWS. " +
      "If not specified, the app will print a one-time snapshot and than exit.",
    ],
  ];

  /** The [[IBApiNext]] instance. */
  protected api: IBApiNext;

  /** The subscription on the IBApi errors. */
  protected error$: Subscription;

  /** The command-line arguments. */
  protected cmdLineArgs: Record<string, string | number>;

  /** Connect to TWS. */
  connect(reconnectInterval?: number, clientId?: number): void {
    // create the IBApiNext object

    const port = (this.cmdLineArgs.port as number) ?? configuration.ib_port;
    const host = (this.cmdLineArgs.host as string) ?? configuration.ib_host;

    logger.debug(`Logging into server: ${host}:${port}`);
    if (!this.api) {
      this.api = new IBApiNext({
        reconnectInterval,
        host,
        port,
      });
      if (this.cmdLineArgs.log) {
        switch (this.cmdLineArgs.log) {
          case "error":
            this.api.logLevel = LogLevel.ERROR;
            break;
          case "warn":
            this.api.logLevel = LogLevel.WARN;
            break;
          case "info":
            this.api.logLevel = LogLevel.INFO;
            break;
          case "debug":
            this.api.logLevel = LogLevel.DETAIL;
            break;
          default:
            this.error(
              `Unknown value '${this.cmdLineArgs.log}' on -log argument.`
            );
            break;
        }
      }
    }

    // log generic errors (reqId = -1) and exit with failure code

    if (!this.error$) {
      this.error$ = this.api.errorSubject.subscribe((error) => {
        if (error.reqId === -1) {
          this.error(`${error.error.message}`);
          logger.error(
            `Encountered error, IB host: ${host} Port: ${port}`
          );
        }
      });
    }

    try {
      this.api.connect(clientId);
    } catch (error) {
      logger.error("Connection error", error.message);
      logger.debug(`IB host: ${host} - IB port: ${port}`);
    }
  }

  /**
   * Print text to console.
   */
  printText(text: string): void {
    console.log(text);
  }

  /**
   * Print an object (JSON formatted) to console.
   */
  printObject(obj: unknown): void {
    console.log(`${JSON.stringify(obj, jsonReplacer, 2)}`);
  }

  /**
   * Print and error to console and exit the app with error code, unless -watch argument is present.
   */
  error(text: string): void {
    console.error(
      colors.bold.red(`[${new Date().toLocaleTimeString()}] ERROR: ${text}`)
    );
    if (!this.cmdLineArgs.watch) {
      this.exit(1);
    }
  }

  /**
   * Exit the app.
   */
  exit(exitCode: number = 0): void {
    this.error$?.unsubscribe();
    process.exit(exitCode);
  }

  /** Parse the command line. */
  private parseCommandLine(
    description: string,
    usage: string,
    optionArguments: [string, string][],
    example: string
  ): void {
    this.cmdLineArgs = {};

    process.argv.slice(2).forEach((arg) => {
      const pair = arg.split("=");
      const name = pair[0].substr(1);
      if (!optionArguments.find((v) => v[0].split("=")[0] == name)) {
        console.error("ERROR: Unknown argument -" + pair[0]);
        process.exit(1);
      }
      this.cmdLineArgs[name] = pair.length > 1 ? pair[1] ?? "1" : "1";
    });

    if (this.cmdLineArgs.h || this.cmdLineArgs.help) {
      console.info(
        this.formatHelpText(description, usage, optionArguments, example)
      );
      process.exit(0);
    }
  }

  /** Format the help text. */
  private formatHelpText(
    description: string,
    usage: string,
    options: [string, string][],
    example: string
  ): string {
    let result = description + "\n" + usage + "\n" + "Options:\n";
    options.forEach((argument) => {
      result += "  -" + argument[0] + ": " + argument[1] + "\n";
    });
    return result + "Example: " + example;
  }
}
