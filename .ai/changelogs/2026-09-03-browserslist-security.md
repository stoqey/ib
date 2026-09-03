# browserslist security resolution

- Summary: Pin the transitive `browserslist` dependency to the patched 4.28.8 release.
- Notable areas: `package.json` resolutions and `yarn.lock`.
- Tests: Yarn install, dependency audit, type check, lint, build, and API Next tests.
- Risks / follow-ups: Existing Yarn resolution warnings remain unchanged.
