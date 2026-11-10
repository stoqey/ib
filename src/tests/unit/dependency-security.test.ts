/**
 * @jest-environment node
 */

import { execFileSync } from "child_process";
import { createRequire } from "module";
import path from "path";
import merge from "deepmerge";

describe("Jest's deepmerge security replacement", () => {
  test("uses the tested merge implementation in Jest configuration", () => {
    const requireFromJest = createRequire(require.resolve("jest-config"));

    expect(requireFromJest.resolve("deepmerge")).toBe(
      require.resolve("deepmerge"),
    );
  });

  test.each([
    ["a null prototype", Object.create(null) as object],
    ["an own prototype key", JSON.parse('{"__proto__":{}}') as object],
    ["a null nested value", { session: null }],
  ])("rejects prototype poisoning with %s", (_name, target) => {
    const payload = JSON.parse(
      '{"__proto__":{"isAdmin":true},"session":{"__proto__":{"isAdmin":true}}}',
    ) as object;

    const result = merge(target, payload) as Record<string, unknown>;
    const session = result.session as Record<string, unknown>;

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result.isAdmin).toBeUndefined();
    expect(Object.getPrototypeOf(session)).toBe(Object.prototype);
    expect(session.isAdmin).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(result, "__proto__")).toBe(
      false,
    );
    expect(Object.prototype.hasOwnProperty.call(session, "__proto__")).toBe(
      false,
    );
  });

  test("preserves Jest's nested configuration and array merging", () => {
    const result = merge.all([
      { globals: { feature: true }, projects: ["first"] },
      { globals: { timeout: 50 }, projects: ["second"] },
    ]);

    expect(result).toEqual({
      globals: { feature: true, timeout: 50 },
      projects: ["first", "second"],
    });
  });
});

describe("TypeDoc's minimatch compatibility plugin", () => {
  test("preserves directory traversal with patched minimatch", () => {
    // Run native ESM so the test uses the same Minimatch prototype as TypeDoc.
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
          import { Minimatch } from "minimatch";
          import { load } from "./scripts/typedoc-minimatch.cjs";
          await load();
          await load();
          const cases = [
            ["src/index.ts", "src", true],
            ["src/index.ts", "other", false],
            ["src/{api,core}/**/*.ts", "src/api", true],
            ["src/{api,core}/**/*.ts", "src/core/nested", true],
            ["src/{api,core}/**/*.ts", "src/common", false],
            ["src/**/*.ts", "src/.hidden", false],
            ["src/**/*.ts", "src/api", true],
            ["src/*.ts", "src/file.js", false],
          ];
          console.log(JSON.stringify(cases.map(([pattern, directory, expected]) => {
            const matcher = new Minimatch(pattern);
            const actual = matcher.set.some(row =>
              matcher.matchOne(directory.split("/"), row, true));
            return { pattern, directory, actual, expected };
          })));
        `,
      ],
      { cwd: path.resolve(__dirname, "../../.."), encoding: "utf8" },
    );
    const results = JSON.parse(output) as {
      pattern: string;
      directory: string;
      actual: boolean;
      expected: boolean;
    }[];

    for (const result of results) {
      expect(result).toEqual({ ...result, actual: result.expected });
    }
  });
});
