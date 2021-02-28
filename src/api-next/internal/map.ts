/**
 * ES6 Map class + some custom convenience functions.
 */
export class IBApiNextMap<K, V> extends Map<K, V> {
  getOrAdd(k: K, factory: (k: K) => V): V {
    let r = this.get(k);
    if (r === undefined) {
      r = factory(k);
      this.set(k, r);
    }
    return r;
  }
}
