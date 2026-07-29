# npm audit dependency updates

- Updated development tooling and refreshed transitive dependencies to clear
  the npm audit findings covered by PRs #276 and #277.
- Replaced the existing broad resolution set with a single `brace-expansion`
  resolution because Jest's current dependency tree still requests vulnerable
  major versions.
- Verified with `yarn audit`, lint, type checking, and the API Next test suite.
- The full test suite still requires a local TWS/IB Gateway on port 4002.
