# fast-uri security resolution

- Summary: Pin the transitive `fast-uri` dependency to the patched 3.1.7 release.
- Notable areas: `package.json` resolutions and `yarn.lock`.
- Tests: Yarn install, dependency audit, type check, lint, and API Next tests.
- Risks / follow-ups: The full suite requires a running TWS or IB Gateway; existing lint warnings remain unchanged.
