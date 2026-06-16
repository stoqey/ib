# Testing Style Guide

Frameworks:

- Use Jest with `ts-jest`; tests live under `src/tests/**`.
- The default test environment is `src/tests/nodb-test-environment.js`, which
  loads `.env` through `dotenv`.
- Use existing custom matchers from `src/tests/setup.ts` when useful.

Commands:

- Full test suite: `yarn test`
- API Next focused suite: `yarn test-next`
- Targeted Jest file:
  `yarn jest path/to/test.test.ts --runInBand --reporters=default --useStderr --detectOpenHandles`
- Lint: `yarn lint`
- Type check: `yarn type-check`
- Build: `yarn build`

Rules:

- Add or update tests for new logic.
- Prefer deterministic unit tests that simulate `IBApi` events over tests that
  require a live TWS or IB Gateway connection.
- Mock external APIs, sockets, timers, and network-dependent behavior unless the
  task is specifically about live integration.
- Keep one behavior per test.
- Use Arrange, Act, Assert structure even when not labeled in comments.
- Avoid shared mutable state between tests; reset timers, listeners, and
  subscriptions in `afterEach` when they are created.
- Use `done`, promises, or async/await consistently with nearby tests.
- Match existing test naming and folder patterns in the touched area.

Live and environment-dependent tests:

- Tests under `src/tests/unit/api` and `src/tests/unit/api-next-live` may depend
  on Interactive Brokers/TWS or IB Gateway configuration.
- Do not add new live-dependent tests unless the task explicitly requires live
  behavior.
- If live tests cannot be run locally because TWS/Gateway or credentials are not
  available, state that clearly in the final response and run the best targeted
  deterministic tests instead.
