# @almeidx/version-check-vue

Vue adapter for `@almeidx/version-check`.

This package provides a renderless `useVersionCheck` composable and re-exports the core API, so Vue apps do not need to install `@almeidx/version-check` directly.

## Install

```sh
pnpm add @almeidx/version-check-vue
```

## Usage

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

The composable polls only in the browser, disposes automatically with the surrounding Vue effect scope, and returns `check()` for an immediate manual check. It uses the shared core lifecycle defaults, including a one-minute `minIntervalMs` cooldown for focus, reconnect, and visibility-triggered checks.

## Version endpoint

The default endpoint is `/version.json`. Generate it during builds with the included CLI:

```json
{
	"scripts": {
		"prebuild": "version-check generate public"
	}
}
```

The CLI reads deployment environment variables by default: `VERSION_CHECK_BUILD_ID`, `SOURCE_COMMIT`, `VERCEL_GIT_COMMIT_SHA`, and `GITHUB_SHA`. Pass `--build-id` when you want an explicit value.

## License

Apache-2.0
