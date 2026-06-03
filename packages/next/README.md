# @almeidx/version-check-next

Next.js adapter for `@almeidx/version-check`.

This package provides helpers for serving the current Next.js build id and a client hook for detecting when a newer deployment is available. It also re-exports the core API.

## Install

```sh
pnpm add @almeidx/version-check-next
```

## App Router route

```ts
// app/api/version/route.ts
import { createNextVersionHandler } from "@almeidx/version-check-next";

export const GET = createNextVersionHandler();
```

## Root layout

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

## Client hook

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

The client hook uses the shared core lifecycle defaults, including a one-minute `minIntervalMs` cooldown for focus, reconnect, and visibility-triggered checks.

## Exports

- `getNextBuildId`
- `createNextVersionPayload`
- `createNextVersionHandler`
- `useNextVersionCheck` from `@almeidx/version-check-next/client`
- Core `@almeidx/version-check` exports

## License

Apache-2.0
