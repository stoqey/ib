/**
 * This file implements tests for the [[IBApiNextMap]] functions.
 */

import { IBApiNextMap } from "../../../core/api-next/map";

describe("IBApiNextMap Tests", () => {
  test("getOrAdd", () => {
    const map = new IBApiNextMap<number, number>();

    const testVal1 = Math.random();
    const testVal2 = Math.random();

    // not there, add it

    let hasAdded = false;
    let res = map.getOrAdd(testVal1, () => {
      hasAdded = true;
      return testVal2;
    });

    expect(res).toEqual(testVal2);
    expect(hasAdded).toBeTruthy();
    expect(map.get(testVal1)).toEqual(testVal2);

    // it's there already

    hasAdded = false;
    res = map.getOrAdd(testVal1, () => {
      hasAdded = true;
      return testVal2;
    });

    expect(res).toEqual(testVal2);
    expect(hasAdded).toBeFalsy();
  });
});
