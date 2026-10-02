# brace-expansion security resolution

- Summary: Pin the transitive `brace-expansion` dependency to patched version 5.0.12.
- Notable areas: `package.json` resolutions and `yarn.lock`.
- Tests: Yarn install and audit, type check, lint, build, and API Next tests.
- Risks / follow-ups: The full audit still reports separate `js-yaml`, `markdown-it`, and `fast-uri` advisories.
