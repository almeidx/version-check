# Version Check

This pnpm monorepo publishes headless version/update detection plus adapters for
React, Vue, Next.js, and Vite. Packages are ESM-only and versioned together.

Use the README for public API examples and `package.json` for the current command
definitions. The workspace currently supports Node.js 22.19 or newer and pnpm 11.

## Package boundaries

- `packages/core` owns polling, payload comparison, build-id detection, and the
  `version-check` CLI.
- `packages/react` and `packages/vue` adapt core state to framework lifecycles.
- `packages/next` owns the route handler, server build-id helper, and client
  hook.
- `packages/vite` owns build-id resolution, `version.json` generation, and the
  virtual module.
- `examples/` are CI build fixtures, not published packages.

Adapters re-export core and delegate their CLI binary to it. Keep shared
behavior in core rather than allowing adapter implementations to drift.

## Public API and test constraints

- Relative source imports use `.js` extensions even though the source is
  TypeScript.
- Match the existing JSDoc style on exported APIs, including `readonly` option
  fields, links, and `@defaultValue` tags where applicable.
- Polling must remain SSR-safe and must clean up focus, online, visibility, and
  timer listeners when the last subscriber is removed.
- Tests alias package imports to source, so most unit tests do not require a
  build. The CLI imports built output; use `pnpm generate:version` when testing
  that workflow locally.
- Keep framework lifecycle behavior in its adapter: React uses
  `useSyncExternalStore`; Vue must preserve effect-scope disposal and SSR
  behavior.

## Validation

`pnpm check` is the full gate (lint, typecheck, tests, builds, and publint). Use
the narrower scripts while iterating, then run the full gate for shared or
published-package changes.

Commit subjects use conventional-commit syntax because they feed the generated
changelog. Do not add assistant-specific authorship trailers.

`CLAUDE.md` is a symlink to this file; edit `AGENTS.md` and preserve the symlink.

Release preparation and publishing are handled by the workflows under
`.github/workflows/`. Do not publish, tag, or dispatch them unless explicitly
asked.
