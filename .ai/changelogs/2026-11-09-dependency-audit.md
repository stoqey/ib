# Dependency audit fixes

- Summary: reduce Yarn audit findings from 19 (4 low, 15 moderate) to 3 (2 low, 1 moderate) by upgrading fast-uri to 3.1.9, Jest's glob to 14.0.4, and lint tooling's minimatch to 11.0.5. Upgrade ESLint to 10.14.0 to separate its minimatch range from TypeDoc under Yarn Classic.
- Notable files: `package.json` and regenerated `yarn.lock`; no application logic changes.
- Tests run: frozen-lockfile install; `yarn lint` (0 errors, 6 existing warnings); `yarn type-check`; deterministic unit tests excluding `unit/api` and `unit/api-next-live` (36 suites, 91 tests); `yarn typedoc --out /tmp/ib-audit-doc-nov` (0 errors, 21 warnings); `yarn audit --json`; `git diff --check`.
- Risks / follow-ups: resolutions cross transitive major-version ranges. TypeDoc remains pinned to minimatch 10.2.5 because minimatch 11 removes `Minimatch.matchOne`, causing TypeDoc 0.28.20 documentation generation to fail (GHSA-g3hv-75wg-m249 remains). Jest's deepmerge 4.3.1 has no published patched release (GHSA-gcqx-w48m-w2h4, reported along two paths). Live TWS/Gateway tests were not run.
