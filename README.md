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

## Version endpoint

The default endpoint is `/version.json`. The payload can be a string or an object with one of
`version`, `buildId`, `id`, `hash`, or `sha`.

```json
{
	"buildId": "2026-06-01T12-00-00Z"
}
```

Generate a simple `public/version.json` during builds:

```sh
pnpm generate:version
```

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
		currentVersion: { buildId: initialVersion },
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

```ts
import { useVersionCheck } from "@almeidx/version-check-vue";

const versionCheck = useVersionCheck({
	currentVersion: import.meta.env.VITE_BUILD_ID,
});

function refreshPage() {
	window.location.reload();
}
```

```html
<button v-if="versionCheck.value.updateAvailable" type="button" @click="refreshPage">Refresh to update</button>
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
