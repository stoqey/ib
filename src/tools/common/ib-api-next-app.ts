import { Subscription } from "rxjs";

import path from "path";
import { IBApiNext, MarketDataType } from "../../api-next";
import Contract from "../../api/contract/contract";
import LogLevel from "../../api/data/enum/log-level";
import OptionType from "../../api/data/enum/option-type";
import SecType from "../../api/data/enum/sec-type";
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
  // private compat_mode: boolean = false;

  public static readonly DEFAULT_CONTRACT_OPTIONS: [string, string][] = [
    ["conid=<number>", "Contract ID (conId) of the contract."],
    [
      "sectype=<type>",
      "The security type. Valid values: STK, OPT, FUT, IND, FOP, CFD, CASH, BAG, BOND, CMDTY, NEWS and FUND",
    ],
    ["symbol=<name>", "The symbol name."],
    ["currency=<currency>", "The contract currency."],
    ["exchange=<name>", "The destination exchange name."],
    ["localsymbol=<name>", "The symbol's local symbol."],
  ];

  public static readonly DEFAULT_OPT_CONTRACT_OPTIONS: [string, string][] = [
    ...IBApiNextApp.DEFAULT_CONTRACT_OPTIONS,
    [
      "expiry=<YYYYMM>",
      "The contract's last trading day or contract month (for Options and Futures)." +
        "Strings with format YYYYMM will be interpreted as the Contract Month whereas YYYYMMDD will be interpreted as Last Trading Day.",
    ],
    ["strike=<number>", "The option's strike price."],
    ["right=<P|C>", " The option type. Valid values are P, PUT, C, CALL."],
    ["multiplier=<number>", "The option's multiplier."],
  ];

  protected logLevel: LogLevel;

  constructor(
    appDescription: string,
    usageDescription: string,
    optionArgumentDescriptions: [string, string][],
    usageExample: string,
  ) {
    this.parseCommandLine(
      appDescription,
      usageDescription,
      [...this.COMMON_OPTION_ARGUMENTS, ...optionArgumentDescriptions],
      usageExample,
    );
    if (this.cmdLineArgs.log) {
      switch (this.cmdLineArgs.log) {
        case "error":
          this.logLevel = LogLevel.ERROR;
          break;
        case "warn":
          this.logLevel = LogLevel.WARN;
          break;
        case "info":
          this.logLevel = LogLevel.INFO;
          break;
        case "debug":
          this.logLevel = LogLevel.DETAIL;
          break;
        default:
          this.error(
            `Unknown value '${this.cmdLineArgs.log}' on -log argument.`,
          );
          break;
      }
    } else {
      this.logLevel = LogLevel.ERROR;
    }
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
      "clientId=<number>",
      "Client id of current ib connection. Default is random",
    ],
    [
      "watch",
      "Watch for changes. If specified, the app will keep running and print updates as received from TWS. " +
        "If not specified, the app will print a one-time snapshot and then exit.",
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
    if (reconnectInterval === undefined && this.cmdLineArgs.watch)
      reconnectInterval = 10000;
    if (clientId === undefined && this.cmdLineArgs.clientId)
      clientId = +this.cmdLineArgs.clientId;

    this.info(`Logging into server: ${host}:${port}`);
    if (!this.api) {
      this.api = new IBApiNext({
        reconnectInterval,
        host,
        port,
        logger,
      });
      this.api.logLevel = this.logLevel;
    }

    // log generic errors (reqId = -1) and exit with failure code

    if (!this.error$) {
      this.error$ = this.api.errorSubject.subscribe((error) => {
        if (error.reqId === -1) {
          this.warn(`${error.error.message} (Error #${error.code})`);
        } else {
          this.error(
            `${error.error.message} (Error #${error.code}) ${
              error.advancedOrderReject ? error.advancedOrderReject : ""
            }`,
          );
        }
      });
    }

    try {
      this.api.connect(clientId);
    } catch (error) {
      this.error(error.message);
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
   * Print an error message and exit the app with error code, unless -watch argument is present.
   */
  error(text: string): void {
    logger.error(text);
    if (!this.cmdLineArgs.watch) {
      this.exit(1);
    }
  }

  /**
   * Print a warning message
   */
  warn(text: string): void {
    if (this.logLevel >= LogLevel.WARN) logger.warn(text);
  }

  /**
   * Print an wainformation message
   */
  info(text: string): void {
    if (this.logLevel >= LogLevel.INFO) logger.info(text);
  }

  /**
   * Print an wainformation message
   */
  debug(text: string): void {
    if (this.logLevel >= LogLevel.DETAIL) logger.debug(text);
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
    example: string,
  ): void {
    this.cmdLineArgs = {};

    process.argv.slice(2).forEach((arg) => {
      const pair = arg.split("=");
      const name = pair[0].substr(1);
      if (!optionArguments.find((v) => v[0].split("=")[0] == name)) {
        console.error("ERROR: Unknown argument " + pair[0]);
        this.exit(1);
      }
      this.cmdLineArgs[name] = pair.length > 1 ? pair[1] ?? "1" : "1";
    });

    if (this.cmdLineArgs.h || this.cmdLineArgs.help) {
      console.info(
        this.formatHelpText(description, usage, optionArguments, example),
      );
      process.exit(0);
    }
  }

  /** Format the help text. */
  private formatHelpText(
    description: string,
    usage: string,
    options: [string, string][],
    example: string,
  ): string {
    let result = description + "\n" + usage + "\n" + "Options:\n";
    options.forEach((argument) => {
      result += "  -" + argument[0] + ": " + argument[1] + "\n";
    });
    return result + "Example: " + example;
  }

  /** get contract from command line args */
  getContractArg(): Contract {
    return {
      conId: (this.cmdLineArgs.conid as number) ?? undefined,
      secType: this.cmdLineArgs.sectype as SecType,
      symbol: this.cmdLineArgs.symbol as string,
      localSymbol: this.cmdLineArgs.localsymbol as string,
      currency: (this.cmdLineArgs.currency as string) ?? "USD",
      exchange: (this.cmdLineArgs.exchange as string) ?? "SMART",
      lastTradeDateOrContractMonth: this.cmdLineArgs.expiry as string,
      strike: (this.cmdLineArgs.strike as number) ?? undefined,
      right: this.cmdLineArgs.right as OptionType,
      multiplier: (this.cmdLineArgs.multiplier as number) ?? undefined,
    };
  }

  /** app startup */
  start(): void {
    const scriptName = path.basename(__filename);
    this.info(`Starting ${scriptName} script`);
    this.connect();
    this.api.setMarketDataType(MarketDataType.DELAYED_FROZEN);
  }
}
