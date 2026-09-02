# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-09-02

- deps: Update patch/minor dependencies (#65)
- deps: Update oxlint to v1.81.0 and oxfmt to v0.66.0
- deps: Update Node.js to v24.20.0 (#64)
- deps: Lock file maintenance (#59)
- deps: Update patch/minor dependencies (#58)
- deps: Lock file maintenance (#57)
- deps: Update patch/minor dependencies (#56)
- deps: Update Node.js to v24.19.0 (#55)
- deps: Lock file maintenance (#54)
- deps: Update patch/minor dependencies (#53)
- deps: Update Node.js to v24.18.1 (#52)
- chore: schedule Renovate updates for Saturday mornings
- deps: Update dependency next to ^16.2.12 (#51)
- deps: Lock file maintenance (#50)
- deps: Update patch/minor dependencies (#49)
- deps: Update patch/minor dependencies (#48)
- deps: Update patch/minor dependencies (#47)
- deps: Update patch/minor dependencies (#46)
- deps: Update dependency happy-dom to ^20.11.0 (#45)
- deps: Lock file maintenance (#44)
- deps: Update pnpm to v11.15.0 (#43)
- deps: Update patch/minor dependencies (#42)
- docs: streamline agent guidance
- deps: Update patch/minor dependencies (#41)
- deps: Update actions/setup-node action to v7 (#40)
- deps: Update patch/minor dependencies (#39)
- deps: Update dependency tsdown to ^0.22.5 (#38)
- deps: Update dependency typescript to v7 (#34)
- deps: Lock file maintenance (#37)
- deps: Update pnpm to v11.11.0 (#36)
- deps: Update dependency vite to ^8.1.4 (#35)
- deps: Update patch/minor dependencies (#33)
- deps: Update patch/minor dependencies (#32)
- deps: Lock file maintenance (#30)
- deps: Update pnpm to v11.10.0 (#31)
- deps: Update patch/minor dependencies (#29)
- deps: Update patch/minor dependencies (#28)
- deps: Update version bump script and workflow for prerelease tagging
- deps: Lock file maintenance (#27)
- deps: Update dependency vue to ^3.5.39 (#26)
- deps: Update patch/minor dependencies (#25)
- chore: separate runtime Node version from engine floor
- deps: Update patch/minor dependencies (#24)
- deps: Update Node.js runtime (#22)
- chore: move Renovate config to JSONC
- chore: group Node.js runtime Renovate updates
- deps: Lock file maintenance (#21)
- deps: Update patch/minor dependencies (#20)
- deps: Update patch/minor dependencies to ^20.10.6 (#19)
- deps: Update actions/checkout action to v7 (#18)

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
