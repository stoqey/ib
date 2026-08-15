# js-yaml security resolution

- Summary: Pin the transitive `js-yaml` dependency to the patched 3.15.1 release.
- Notable areas: `package.json` resolutions and `yarn.lock`.
- Tests: Yarn install, dependency audit, type check, and lint.
- Risks / follow-ups: No known follow-ups; the existing lint warnings remain unchanged.
