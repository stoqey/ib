exports.load = async function () {
  const { Minimatch } = await import("minimatch");

  if (typeof Minimatch.prototype.matchOne !== "function") {
    // TypeDoc 0.28 uses set.some(row => matchOne(path, row, true)) to
    // decide whether to descend into a directory. Minimatch 11's public
    // partial match checks all rows and gives the same traversal decision.
    // Remove this plugin when TypeDoc uses the public matching API.
    Object.defineProperty(Minimatch.prototype, "matchOne", {
      configurable: true,
      value(path, _row, partial) {
        if (partial !== true) {
          throw new Error(
            "The TypeDoc compatibility plugin only supports partial matches",
          );
        }
        return this.match(path.join("/"), true);
      },
    });
  }
};
