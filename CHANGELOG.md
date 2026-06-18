# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-06-18

This is the first public-ready release of `version-check`: a small, headless way for web apps to
detect that a newer deployment is available without forcing a UI pattern or automatic reload.

- Ships the core `@almeidx/version-check` package with `createVersionChecker`, JSON version
  fetching, payload normalization, comparison helpers, browser polling, and focus/online/visibility
  rechecks.
- Adds React and Vue integrations (`useVersionCheck`) that manage the checker lifecycle while
  leaving applications in control of their own "refresh to update" UI.
- Adds a Next.js adapter for App Router apps with `getNextBuildId`, `createNextVersionHandler`, and
  `useNextVersionCheck` for serving and polling the current build id.
- Adds a Vite plugin that resolves one build id, serves/emits `/version.json`, and exposes the same
  id through `virtual:version-check/build-id`.
- Includes the `version-check generate` CLI for writing `version.json` from deployment metadata such
  as `VERSION_CHECK_BUILD_ID`, `SOURCE_COMMIT`, Vercel/GitLab/GitHub commit env vars, or
  `local-dev`.
- Documents the default `/version.json` contract, supported payload shapes, lifecycle options,
  package exports, examples, and stable peer ranges (Next.js 15+, Vite 6+).
- Publishes all packages as ESM-only TypeScript packages with public npm metadata,
  provenance-enabled release publishing, CI validation, package builds, examples, tests, and publint
  checks.

## [0.2.0-next.5] - 2026-06-17

- deps: Lock file maintenance (#13)
- deps: Update patch/minor dependencies (#14)
- deps: Update patch/minor dependencies (#12)
- Disable Renovate peer dependency updates
- chore(deps): bump dependencies
- ci: run pre-commit through nano-staged
- refactor: share normalizeBuildId from core build helpers
- docs: add AGENTS.md with CLAUDE.md symlink
- feat!: require Vite 6 or newer
- feat!: require Next 15 or newer
- test: add CLI and lifecycle option tests to core
- test: add tests for the Next.js adapter
- ci: add build and publint steps
- Fix React version check option stability

## [0.2.0-next.4] - 2026-06-08

- Fix core README export name
- Add CI_COMMIT_SHA to build id resolution

## [0.2.0-next.3] - 2026-06-03

- refactor: make build id resolution env-only
- Move version bump script under .github

## [0.2.0-next.2] - 2026-06-03

- Add Vite plugin for version checks
- Set default lifecycle recheck cooldown to one minute

## [0.2.0-next.1] - 2026-06-03

- Remove root version.json artifact
- Add package changelogs
- Add package readmes and metadata

## [0.2.0-next.0] - 2026-06-02

- Harden version checker, refine adapters, document and reorganize core
- add tsdown-built cli bins
- simplify framework hook APIs
- chore: fix package versions
- feat: initial commit

## [0.0.1] - 2026-06-01

- Initial public scaffold.
