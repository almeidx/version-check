# version-check

Headless version/update detection for web apps.

`@almeidx/version-check` polls a deployment version endpoint and reports when the deployed
identity differs from the version that rendered the current page. Framework packages keep the same
renderless model so applications can show their own “New version available, refresh to update.”
message.

## Packages

| Package                        | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `@almeidx/version-check`       | Core checker, comparison helpers, polling lifecycle |
| `@almeidx/version-check-react` | React hook                                          |
| `@almeidx/version-check-next`  | Next.js build id route helper and client hook       |
| `@almeidx/version-check-vue`   | Vue composable                                      |

Framework packages re-export the core API and expose the `version-check` CLI, so apps only need to
install the package they use.

## Version endpoint

The default endpoint is `/version.json`. The payload can be a string or an object with one of
`version`, `buildId`, `id`, `hash`, or `sha`.

```json
{
	"buildId": "2026-06-01T12-00-00Z"
}
```

Generate a simple `public/version.json` during builds with the package CLI.

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

The generated `buildId` uses `VERSION_CHECK_BUILD_ID`, `VERCEL_GIT_COMMIT_SHA`,
`GITHUB_SHA`, or the current package version.

## Vanilla JS

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

## React

```tsx
import { useVersionCheck } from "@almeidx/version-check-react";

function refreshPage() {
	window.location.reload();
}

export function VersionBanner({ currentVersion }: { currentVersion: string }) {
	const versionCheck = useVersionCheck({
		currentVersion,
		intervalMs: 30 * 60 * 1000,
	});

	if (!versionCheck.updateAvailable) return null;

	return (
		<div role="status">
			New version available.
			<button type="button" onClick={refreshPage}>
				Refresh
			</button>
		</div>
	);
}
```

## Next.js

Create an App Router route:

```ts
// app/api/version/route.ts
import { createNextVersionHandler } from "@almeidx/version-check-next";

export const GET = createNextVersionHandler();
```

Pass the initial build id from the root layout:

```tsx
// app/layout.tsx
import { getNextBuildId } from "@almeidx/version-check-next";
import type { PropsWithChildren } from "react";
import { VersionBanner } from "./version-banner";

export default async function RootLayout({ children }: PropsWithChildren) {
	const buildId = await getNextBuildId();

	return (
		<html lang="en">
			<body>
				<VersionBanner initialVersion={buildId} />
				{children}
			</body>
		</html>
	);
}
```

Use the client hook:

```tsx
"use client";

import { useNextVersionCheck } from "@almeidx/version-check-next/client";

function refreshPage() {
	window.location.reload();
}

export function VersionBanner({ initialVersion }: { initialVersion: string }) {
	const versionCheck = useNextVersionCheck({
		currentVersion: initialVersion,
	});

	if (!versionCheck.updateAvailable) return null;

	return (
		<div role="status">
			New version available.
			<button type="button" onClick={refreshPage}>
				Refresh
			</button>
		</div>
	);
}
```

## Vue

The composable returns the reactive `state` plus `check` (force a check now) and `stop` (tear down
early). It only polls in the browser, so it is SSR-safe, and it disposes automatically with the
surrounding effect scope.

```ts
import { useVersionCheck } from "@almeidx/version-check-vue";

const { state } = useVersionCheck({
	currentVersion: import.meta.env.VITE_BUILD_ID,
});

function refreshPage() {
	window.location.reload();
}
```

```html
<button v-if="state.updateAvailable" type="button" @click="refreshPage">Refresh to update</button>
```

## Custom comparison

By default, any deployment identity change is considered an update. Use `compare` when your app
needs a stricter policy, such as semver-only upgrades or channel-aware deploys.

```ts
createVersionChecker({
	currentVersion: "2.0.0",
	compare: ({ currentVersion, latestVersion }) => String(latestVersion) > String(currentVersion),
});
```

## Polling behavior

The checker polls every `intervalMs` (default 30 minutes) and also re-checks on window focus, network
reconnect, and the tab becoming visible. A few options tune this:

- `pauseWhenHidden` (default `true`) pauses the interval while the tab is hidden and checks once it
  becomes visible again, instead of polling a backgrounded tab.
- `minIntervalMs` (default `0`) sets a minimum gap between lifecycle-triggered checks. Bursts of
  focus/online/visibility events are always collapsed to a single in-flight check regardless.
- `refetchOnWindowFocus`, `refetchOnReconnect`, and `refetchOnVisibilityChange` (each default `true`)
  turn off individual triggers.

The React and Vue hooks also expose `check()` to force an immediate check (e.g. from a "check for
updates" button); the Vue composable additionally returns `stop()`.

## Development

```sh
pnpm install
pnpm check
```

Useful scripts:

- `pnpm build` builds packages and examples.
- `pnpm build:typecheck` runs TypeScript strict type checks.
- `pnpm lint` runs oxlint.
- `pnpm fmt` runs oxfmt.
- `pnpm test` runs vitest.
