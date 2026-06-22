# Deno import side effects

- Replaced direct `colors` imports in runtime loggers with a tiny internal ANSI wrapper to avoid importing `colors` during package import.
- Removed top-level `dotenv.config()` and eager configuration loading; the default configuration export now loads on first property access and invokes `dotenv.config()` lazily to preserve `.env` support.
- Added tests covering lazy configuration import behavior and explicit env override setup.
- Follow-up audit fix: upgraded `jest-junit` and pinned vulnerable transitive audit targets through Yarn resolutions for `@babel/core`, `@babel/helpers`, `js-yaml`, and `markdown-it`.
- Tests run: targeted configuration Jest tests, lint, type-check, build, Typedoc smoke test, Deno import/config probes, `yarn audit`.
- Risks/follow-ups: `colors` and `dotenv` remain declared dependencies to keep this change low-blast-radius; a later dependency cleanup can remove them with a lockfile update. `js-yaml` is resolved to `4.2.0` even for an older Istanbul range because that package uses `yaml.load`, which is still available.
