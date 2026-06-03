# @almeidx/version-check-vite

Vite plugin for `@almeidx/version-check`.

This package resolves one build id for a Vite app, injects it into client code, emits `version.json` during builds, serves the same payload in dev, and re-exports the core API.

## Install

```sh
pnpm add @almeidx/version-check-vite
```

## Usage

Add the plugin to `vite.config.ts`:

```ts
import { versionCheck } from "@almeidx/version-check-vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [versionCheck()],
});
```

Read the matching build id from the virtual module:

```ts
import buildId from "virtual:version-check/build-id";

createVersionChecker({
	currentVersion: buildId,
});
```

For TypeScript, reference the virtual module types from your app env file:

```ts
import "@almeidx/version-check-vite/virtual";
```

## Version endpoint

The plugin emits `dist/version.json` during builds and serves `/version.json` during dev. Both contain the same build id that the virtual module exposes:

```json
{
	"buildId": "2026-06-01T12-00-00Z"
}
```

The generated `buildId` uses an explicit `buildId` option, `VERSION_CHECK_BUILD_ID`, `SOURCE_COMMIT`, `VERCEL_GIT_COMMIT_SHA`, `GITHUB_SHA`, `git rev-parse HEAD`, package version, or `local-dev`.

## Options

```ts
versionCheck({
	buildId: process.env.MY_BUILD_ID,
	fileName: "version.json",
	define: "__VERSION_CHECK_BUILD_ID__",
});
```

- `buildId` overrides automatic resolution.
- `fileName` changes the emitted and served JSON asset name.
- `define` changes the injected global constant name. Pass `false` to disable the global constant and use only the virtual module.

## License

Apache-2.0
