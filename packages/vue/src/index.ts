export * from "@almeidx/version-check";

import {
	createVersionChecker,
	type VersionCheckOptions,
	type VersionCheckState,
	type VersionPayload,
} from "@almeidx/version-check";
import { getCurrentScope, onScopeDispose, readonly, shallowRef, type DeepReadonly, type Ref } from "vue";

/** Options for {@link useVersionCheck}: {@link VersionCheckOptions} without `autoStart` (the composable owns the lifecycle). */
export type UseVersionCheckOptions<TLatest extends VersionPayload = VersionPayload> = Omit<
	VersionCheckOptions<TLatest>,
	"autoStart"
>;

/** Return value of {@link useVersionCheck}. */
export type UseVersionCheckResult<TLatest extends VersionPayload = VersionPayload> = {
	/** Reactive, read-only checker state. */
	readonly state: DeepReadonly<Ref<VersionCheckState<TLatest>>>;
	/** Trigger an out-of-band check immediately, e.g. from a "check for updates" button. */
	readonly check: () => Promise<VersionCheckState<TLatest>>;
	/** Stop polling and remove listeners. Called automatically when the surrounding effect scope is disposed. */
	readonly stop: () => void;
};

/**
 * Vue composable around {@link createVersionChecker}. Polls only in the browser (SSR-safe) and is
 * disposed automatically with the surrounding effect scope.
 *
 * When called outside an active effect scope it warns, and the returned {@link UseVersionCheckResult.stop | stop}
 * must be called manually to avoid leaking the poller.
 *
 * @example
 * ```ts
 * const { state, check } = useVersionCheck({ currentVersion: import.meta.env.VITE_BUILD_ID });
 * // template: <button v-if="state.updateAvailable" @click="check">Refresh</button>
 * ```
 */
export function useVersionCheck<TLatest extends VersionPayload = VersionPayload>(
	options: UseVersionCheckOptions<TLatest>,
): UseVersionCheckResult<TLatest> {
	const checker = createVersionChecker<TLatest>({
		...options,
		autoStart: false,
	});
	const state = shallowRef(checker.getState()) as Ref<VersionCheckState<TLatest>>;
	const unsubscribe = checker.subscribe((nextState) => {
		state.value = nextState;
	});

	function stop(): void {
		unsubscribe();
		checker.stop();
	}

	// Only poll in the browser. During SSR (Nuxt) `start()` would fire a fetch and an interval on the
	// server that never gets cleaned up.
	if (typeof window !== "undefined") {
		checker.start();
	}

	if (getCurrentScope() !== undefined) {
		onScopeDispose(stop);
	} else if (typeof window !== "undefined") {
		console.warn(
			"[version-check] useVersionCheck() was called outside an active effect scope, so it will not be " +
				"disposed automatically. Call the returned stop() when you are done to avoid leaking the poller.",
		);
	}

	return {
		state: readonly(state) as DeepReadonly<Ref<VersionCheckState<TLatest>>>,
		check: () => checker.check(),
		stop,
	};
}
