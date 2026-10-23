# Audit dependency fixes

- Summary: recovered the cloud task's `js-yaml` 5.5.0 and `markdown-it` 15.0.3 resolutions locally, removing vulnerable transitive packages; included the prerequisite Handlebars 4.7.10 update from PR #286.
- Notable files: `package.json` resolutions and regenerated `yarn.lock`.
- Tests run locally: `yarn lint` (0 errors, 6 existing warnings), `yarn type-check`, `yarn build`, `yarn test-next` (28 suites, 68 tests), `yarn typedoc --out /tmp/ib-audit-doc` (0 errors, 21 documentation warnings), `yarn audit --json` (0 vulnerabilities across 475 dependencies), and `git diff --check`.
- Risks / follow-ups: security resolutions cross transitive dependency major-version ranges; documentation generation and the deterministic suite passed. Live TWS/Gateway tests were not run locally; the source cloud task reported connection failures.
