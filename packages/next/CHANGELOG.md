# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-06-18

- chore: run publint in release publish workflow
- deps: Update patch/minor dependencies (#16)

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
