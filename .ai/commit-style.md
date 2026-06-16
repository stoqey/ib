# Commit Style Guide

Use Conventional Commits.

Format:

```text
<type>(optional scope): <short summary>
```

Types:

- feat
- fix
- refactor
- perf
- test
- docs
- chore
- ci
- update

Rules:

- Use present tense, such as "add" not "added".
- Keep the summary at 72 characters or less.
- Do not use emojis.
- Reference issues when relevant.
- Use scopes that match repo areas when helpful, such as `api`, `api-next`,
  `core`, `tests`, `docs`, or `deps`.

Examples:

```text
feat(api-next): add market rule wrapper
fix(core): prevent duplicate reconnect timer
test(api-next): cover historical tick errors
update(rxjs): v7.8.2
```
