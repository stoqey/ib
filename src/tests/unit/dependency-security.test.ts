/**
 * @jest-environment node
 */

import { createRequire } from "module";
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
