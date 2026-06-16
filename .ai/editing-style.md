# Editing Style Guide

File placement:

- Prefer editing the closest relevant existing file over creating a new file.
- Keep source changes under `src/` unless the task is explicitly about repo
  metadata, tooling, docs, or release configuration.
- Keep tests near existing coverage under `src/tests/unit/...`, matching the
  API area being changed.
- Do not create new `*.utils.*`, `*.helpers.*`, or similar abstraction files
  for single-use logic.

Create a new file only when:

- The logic is reused in multiple places.
- The existing file would become meaningfully harder to understand.
- The user explicitly asks for extraction or separation.
- The file matches an existing local pattern in the touched area.

Function structure:

- Prefer one larger readable method over several small single-use methods wired
  together.
- Keep the main control flow in the owning method when that makes the logic
  easier to follow top-to-bottom.
- Extract a new method only when the logic is reused, the boundary is genuinely
  clearer, or the user explicitly asks for extraction.
- Do not create pass-through helpers or indirection layers that force readers to
  jump across methods just to follow one path.

Runtime and API behavior:

- Preserve the public API surface unless the task explicitly requests a breaking
  change.
- Be careful with `EventName` emissions, request IDs, subscriptions,
  reconnect/cleanup paths, and RxJS subscription lifetimes.
- Avoid leaking timers, sockets, listeners, and subscriptions. Tests should
  assert cleanup when changing lifecycle behavior.
- Do not add runtime dependencies without explicit approval.

Readability:

- Optimize for code that a human can understand quickly on a direct read.
- Prefer explicit control flow and straightforward data handling over clever
  tricks, dense chaining, or abstraction for its own sake.
- Use intent-revealing names for variables, methods, and intermediate values.
- Avoid short or ambiguous names unless the scope is tiny and the meaning is
  obvious.
