# AGENTS.md

# Agent Instructions

You are an AI coding agent working in this repository.

All mandatory rules are defined in the `.ai/` directory:

- `.ai/commit-style.md`
- `.ai/editing-style.md`
- `.ai/testing-style.md`
- `.ai/state.md`

You MUST read and follow them before making any changes.

General behavior:

- Prefer minimal diffs.
- Do not refactor unrelated code.
- Do not introduce new dependencies without approval.
- Always add or update tests for new logic.
- Do not modify generated files.
- Generated files include `dist/`, `coverage/`, `doc-dev/`, `reports/`,
  `junit.xml`, generated clients/types, compiled assets, files marked with
  generated headers, and package-manager lockfiles. Update them only when the
  requested change directly requires regeneration or an approved
  dependency/package-manager change requires it.
- Avoid touching credentials, account files, local environment files,
  Interactive Brokers config, CI workflows, or release configuration unless the
  issue explicitly asks for it.

If rules conflict, follow this priority:

testing > editing style > commit style > general rules

## Repository Expectations

- Use `yarn`; this repo has `yarn.lock` and package scripts use Yarn.
- Keep changes minimal and localized.
- Prefer existing patterns over new abstractions.
- Run lint, type checks, and targeted Jest tests for touched code when feasible.
- For generated PRs, include:
  - summary
  - tests run
  - risks / follow-ups

## Code Style

- This is a TypeScript Node.js package targeting CommonJS output in `dist/`.
- Source code lives under `src/`; tests live under `src/tests/`.
- Respect the existing API boundaries between `src/api`, `src/api-next`,
  `src/core`, `src/common`, and `src/tools`.
- Keep public exports in `src/index.ts` and `src/api-next/index.ts` in sync
  when changing public API.
- Follow the repo ESLint and Prettier settings: double quotes, semicolons,
  trailing commas, and 2-space indentation.
