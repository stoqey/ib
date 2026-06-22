# API Next Realtime Bars And Tick String

- summary: added `IBApiNext.getRealTimeBars` and raw `tickString` market data support.
- notable files or areas changed: `src/api-next/api-next.ts`, `src/api-next/market/market-data.ts`, `src/tests/unit/api-next`.
- tests run: `yarn jest src/tests/unit/api-next/get-market-data.test.ts src/tests/unit/api-next/get-real-time-bars.test.ts --runInBand --reporters=default --useStderr --detectOpenHandles`; `yarn type-check`; `yarn lint`; `yarn build`; live paper TWS probes against ES Sep 2026 for `getRealTimeBars` and `getMarketData(..., "233", false, false)`.
- risks or follow-ups: live probe covered one ES futures contract; other instruments and market data permissions were not exhaustively probed.
