# 2026-06-16 contract exports

- Summary: exported `Crypto` from the package API and aligned `Index` constructor argument order with the other simple contract classes.
- Notable files: `src/index.ts`, `src/api/contract/ind.ts`, `src/tests/unit/api/contract-api.test.ts`, `src/tests/unit/sample-data/contracts.ts`.
- Tests run: targeted Jest contract API test.
- Risks or follow-ups: `Index` callers using the previous exchange/currency argument order should update to `new Index(symbol, exchange, currency)`.
