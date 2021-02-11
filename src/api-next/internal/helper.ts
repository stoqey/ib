/**
 * @internal
 *
 * Returns undefined is the value is Number.MAX_VALUE, or the value otherwise.
 */
export function undefineMax(v: number | undefined): number | undefined {
  return v === undefined || v === Number.MAX_VALUE ? undefined : v;
}
