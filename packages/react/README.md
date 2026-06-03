# @almeidx/version-check-react

React adapter for `@almeidx/version-check`.

This package provides a renderless `useVersionCheck` hook and re-exports the core API, so React apps do not need to install `@almeidx/version-check` directly.

## Install

```sh
pnpm add @almeidx/version-check-react
```

## Usage

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

The hook starts polling on mount, stops on unmount, and returns the current checker state plus `check()` for an immediate manual check. It uses the shared core lifecycle defaults, including a one-minute `minIntervalMs` cooldown for focus, reconnect, and visibility-triggered checks.

## Version endpoint

The default endpoint is `/version.json`. Generate it during builds with the included CLI:

```json
{
	"scripts": {
		"prebuild": "version-check generate public"
	}
}
```

## License

Apache-2.0
