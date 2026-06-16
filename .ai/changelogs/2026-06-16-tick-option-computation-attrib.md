# 2026-06-16 tick option computation attrib

- summary: Include `tickAttrib` in `tickOptionComputation` event emissions and typings so option computation values stay aligned.
- notable files or areas changed: `src/core/io/decoder.ts`, `src/api/api.ts`, `src/api-next/api-next.ts`, targeted unit tests.
- tests run: `yarn jest src/tests/unit/tick-option-computation-decoder.test.ts src/tests/unit/api-next/get-market-data.test.ts --runInBand --reporters=default --useStderr --detectOpenHandles`; `yarn type-check`.
- risks or follow-ups: `tickAttrib` is passed through but remains unused by the API-next market data mapping.
