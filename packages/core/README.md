# @almeidx/version-check

Headless version/update detection for web apps.

`@almeidx/version-check` polls a deployment version endpoint and reports when the deployed identity differs from the version that rendered the current page. It does not render UI, reload the page, or choose a notification system for you.

## Install

```sh
pnpm add @almeidx/version-check
```

## Version endpoint

The default endpoint is `/version.json`. The payload can be a string or an object with one of `version`, `buildId`, `id`, `hash`, or `sha`.

```json
{
	"buildId": "2026-06-01T12-00-00Z"
}
```

Generate a `public/version.json` file during builds with the package CLI:

```sh
version-check generate public
```

For package scripts:

```json
{
	"scripts": {
		"prebuild": "version-check generate public"
	}
}
```

The generated `buildId` uses `VERSION_CHECK_BUILD_ID`, `SOURCE_COMMIT`, `VERCEL_GIT_COMMIT_SHA`, `GITHUB_SHA`, or `local-dev`.

## Usage

```ts
import { createVersionChecker } from "@almeidx/version-check";

const checker = createVersionChecker({
	currentVersion: window.__BUILD_ID__,
	intervalMs: 30 * 60 * 1000,
});

checker.subscribe((state) => {
	if (state.updateAvailable) {
		document.querySelector("#update-banner")?.removeAttribute("hidden");
	}
});

checker.start();
```

## Polling behavior

The checker polls every `intervalMs` (default 30 minutes) and also re-checks on window focus, network reconnect, and the tab becoming visible.

- `pauseWhenHidden` (default `true`) pauses the interval while the tab is hidden and checks when it becomes visible again if the lifecycle cooldown has elapsed.
- `minIntervalMs` (default 1 minute) sets a minimum gap between lifecycle-triggered checks. Set it to `0` to disable the cooldown.
- `refetchOnWindowFocus`, `refetchOnReconnect`, and `refetchOnVisibilityChange` (each default `true`) turn off individual triggers.

## Exports

- `createVersionChecker`
- `compareVersions`
- `defaultLifecycleMinIntervalMs`
- `fetchJsonVersion`
- `VersionCheckError`
- Version payload and checker option/state types
- Node-only `@almeidx/version-check/build`: `resolveBuildId`, `writeVersionFile`, `createVersionFileContent`

## License

Apache-2.0
