# AGENTS.md

Headless version/update detection for web apps: the core package polls a `/version.json`
endpoint and reports when the deployed build id differs from the one that rendered the page.
Apps render their own "refresh to update" UI. pnpm monorepo; all packages are published to npm
as ESM-only.

## Layout

- `packages/core` — `@almeidx/version-check`: `createVersionChecker` (polling + focus/online/
  visibility refetch), `fetchJsonVersion`, payload/compare helpers, `version-check` CLI
  (`src/cli.ts`) that writes `version.json` from deployment env vars (`src/build-id.ts`).
- `packages/react` — `useVersionCheck` hook (wraps core via `useSyncExternalStore`).
- `packages/vue` — `useVersionCheck` composable (SSR-safe, effect-scope disposal).
- `packages/next` — `createNextVersionHandler` route handler + `getNextBuildId` (server),
  `useNextVersionCheck` (client, subpath `./client`). Requires Next 15+.
- `packages/vite` — Vite plugin: resolves one build id, serves/emits `version.json`, exposes a
  `virtual:version-check/build-id` module (types via subpath `./virtual`). Requires Vite 6+.
- `examples/` — next, react-vite, vue-vite demo apps (built in CI's `pnpm build`, not published).
- Adapters re-export all of core and ship the same `version-check` bin delegating to core's CLI.

## Commands

| Task                       | Command                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| Install                    | `pnpm install` (Node >= 24, pnpm 11)                                    |
| Everything CI runs         | `pnpm check` (lint, typecheck, test, build, publint)                    |
| Test (all)                 | `pnpm test` (vitest run)                                                |
| Test (one package/file)    | `pnpm test packages/core` or `pnpm test packages/core/test/cli.test.ts` |
| Typecheck                  | `pnpm build:typecheck`                                                  |
| Lint (check only)          | `pnpm lint` (oxfmt --check + oxlint)                                    |
| Auto-format/fix            | `pnpm fmt`                                                              |
| Build packages + examples  | `pnpm build` (output in gitignored `dist/`)                             |
| Validate publish artifacts | `pnpm publint` (run after `pnpm build`)                                 |

## Conventions and gotchas

- Tabs for indentation everywhere (enforced by oxfmt), including JSON.
- Strict TS, ESM only (`type: module`, `.js` extensions on relative imports in `src/`).
- Public API has JSDoc with `{@link ...}`; options objects use `readonly` fields with
  `@defaultValue` tags. Match this on any exported symbol.
- Tests live in `packages/*/test/`. `vitest.config.ts` aliases `@almeidx/version-check`
  (plus `/build`) and `@almeidx/version-check-react` to `packages/*/src` so cross-package tests
  run **without building**. Core tests use a hand-rolled `FakeWindow` (see
  `packages/core/test/index.test.ts`) and `vi.useFakeTimers()`; only the react test file sets
  `@vitest-environment happy-dom`; vue tests intentionally run in node and stub `window` (the
  SSR test depends on it being absent).
- `dist/` is gitignored; bins import from `dist/`, so the CLI needs a build to run locally
  (`pnpm generate:version` does both).
- Pre-commit hook (`.github/husky/pre-commit`) runs `pnpm fmt` and re-stages.
- AI-assisted commits end with `Assisted-by: Claude:<model-id>` (one line per model that
  materially produced the change — kernel coding-assistants convention). Never add
  `Co-Authored-By`; `Signed-off-by` is for humans only.
- `CLAUDE.md` is a symlink to this file — edit `AGENTS.md`, never replace the symlink.

## Releases

- `Prepare Release` workflow (manual dispatch) bumps all package versions in lockstep via
  `.github/scripts/version-packages.mjs`, regenerates changelogs, and opens a `release/v*` PR.
- Merging that PR triggers `Publish Release`: full checks, build, `pnpm pack` per package,
  `npm publish` with provenance, git tag + GitHub release. Versions stay identical across all
  five packages.
