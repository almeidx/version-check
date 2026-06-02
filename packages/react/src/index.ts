"use client";

export * from "@almeidx/version-check";

import {
	createVersionChecker,
	type VersionCheckOptions,
	type VersionCheckState,
	type VersionPayload,
} from "@almeidx/version-check";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

/** Options for {@link useVersionCheck}: {@link VersionCheckOptions} without `autoStart` (the hook owns the lifecycle). */
export type UseVersionCheckOptions<TLatest extends VersionPayload = VersionPayload> = Omit<
	VersionCheckOptions<TLatest>,
	"autoStart"
>;

/** Return value of {@link useVersionCheck}: the current {@link VersionCheckState} plus a manual {@link UseVersionCheckResult.check | check} trigger. */
export type UseVersionCheckResult<TLatest extends VersionPayload = VersionPayload> = VersionCheckState<TLatest> & {
	/** Trigger an out-of-band check immediately, e.g. from a "check for updates" button. */
	readonly check: () => Promise<VersionCheckState<TLatest>>;
};

/**
 * Subscribes to a {@link createVersionChecker} for the lifetime of the component and returns its
 * latest {@link VersionCheckState} along with a manual {@link UseVersionCheckResult.check | check} trigger.
 *
 * Polling starts on mount and stops on unmount. The checker is recreated when its options change;
 * memoize object and function options if you need to keep the checker identity stable.
 *
 * @example
 * ```tsx
 * function Banner({ currentVersion }: { currentVersion: string }) {
 * 	const { updateAvailable } = useVersionCheck({ currentVersion });
 * 	return updateAvailable ? <RefreshPrompt /> : null;
 * }
 * ```
 */
export function useVersionCheck<TLatest extends VersionPayload = VersionPayload>(
	options: UseVersionCheckOptions<TLatest>,
): UseVersionCheckResult<TLatest> {
	const {
		checkImmediately,
		compare,
		currentVersion,
		endpoint,
		fetch,
		fetcher,
		getWindow,
		intervalMs,
		minIntervalMs,
		now,
		pauseWhenHidden,
		refetchOnReconnect,
		refetchOnVisibilityChange,
		refetchOnWindowFocus,
		requestInit,
	} = options;

	const checker = useMemo(
		() =>
			createVersionChecker<TLatest>({
				currentVersion,
				autoStart: false,
				endpoint,
				intervalMs,
				minIntervalMs,
				fetcher,
				compare,
				requestInit,
				checkImmediately,
				pauseWhenHidden,
				refetchOnWindowFocus,
				refetchOnVisibilityChange,
				refetchOnReconnect,
				fetch,
				getWindow,
				now,
			}),
		[
			currentVersion,
			endpoint,
			intervalMs,
			minIntervalMs,
			fetcher,
			compare,
			requestInit,
			checkImmediately,
			pauseWhenHidden,
			refetchOnWindowFocus,
			refetchOnVisibilityChange,
			refetchOnReconnect,
			fetch,
			getWindow,
			now,
		],
	);

	const subscribe = useCallback((onStoreChange: () => void) => checker.subscribe(() => onStoreChange()), [checker]);
	const getSnapshot = useCallback(() => checker.getState(), [checker]);
	const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	const check = useCallback(() => checker.check(), [checker]);

	useEffect(() => {
		checker.start();

		return () => {
			checker.stop();
		};
	}, [checker]);

	return useMemo(() => ({ ...state, check }), [state, check]);
}
