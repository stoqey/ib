import colors from "colors";
import { IBApiNext } from "../../api-next";
import { Subscription } from "rxjs";

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

    // create the IBApiNext object

    this.api = new IBApiNext(0, {
      host: this.cmdLineArgs.host,
      port:
        this.cmdLineArgs.port !== undefined
          ? Number(this.cmdLineArgs.port)
          : undefined,
    });

    // log generic errors (reqId = -1) and exit with failure code

    this.error$ = this.api.errorSubject.subscribe((error) => {
      if (error.reqId === -1) {
        this.error(`ERROR: ${error.error.message}`);
      }
    });

    // connect to TWS

    this.api.connect();
  }

  /** Common command line options of all [[IBApiNext]] apps. */
  private readonly COMMON_OPTION_ARGUMENTS: [string, string][] = [
    ["h", "Print the help text."],
    [
      "host=<hostname>",
      "IP or hostname of the TWS or IB Gateway. Default is 127.0.0.1.",
    ],
    ["port=<number>", "Post number of the TWS or IB Gateway. Default is 7496."],
  ];

  /** The [[IBApiNext]] instance. */
  protected api: IBApiNext;

  /** The subscription on the IBApi errors. */
  protected error$: Subscription;

  /** The command-line arguments. */
  protected cmdLineArgs: Record<string, string>;

  /**
   * Print text to console.
   */
  printText(text: string): void {
    console.log(text);
  }

  /**
   * Print text to console.
   */
  printObject(obj: unknown): void {
    console.log(`${JSON.stringify(obj, jsonReplacer, 2)}`);
  }

  /**
   * Print and error to console and exit the app with error code.
   */
  error(text: string): void {
    console.error(
      colors.bold.red(`[${new Date().toLocaleTimeString()}] ERROR: ${text}`)
    );
    this.exit(1);
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

    if (this.cmdLineArgs.h) {
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
