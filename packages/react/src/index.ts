"use client";

export * from "@almeidx/version-check";

import {
	createVersionChecker,
	fetchJsonVersion,
	isUpdateAvailable,
	type VersionComparator,
	type VersionCheckOptions,
	type VersionCheckState,
	type VersionFetcher,
	type VersionPayload,
} from "@almeidx/version-check";
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

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
 * Polling starts on mount and stops on unmount. The checker is recreated when lifecycle options
 * change; fetch and comparison callbacks are read from the latest render without restarting.
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

	const latestOptions = { compare, fetch, fetcher, now, requestInit };
	const latestOptionsRef = useRef(latestOptions);
	latestOptionsRef.current = latestOptions;

	const latestFetcher = useCallback<VersionFetcher<TLatest>>(async (context) => {
		const { fetch, fetcher, requestInit } = latestOptionsRef.current;
		const nextContext = { ...context, fetch, requestInit };

		if (fetcher !== undefined) {
			return fetcher(nextContext);
		}

		return fetchJsonVersion<TLatest>(nextContext);
	}, []);

	const latestCompare = useCallback<VersionComparator<TLatest>>(
		({ currentVersion, latestVersion }) =>
			isUpdateAvailable(currentVersion, latestVersion, latestOptionsRef.current.compare),
		[],
	);

	const latestNow = useCallback(() => latestOptionsRef.current.now?.() ?? Date.now(), []);

	const checker = useMemo(
		() =>
			createVersionChecker<TLatest>({
				currentVersion,
				autoStart: false,
				endpoint,
				intervalMs,
				minIntervalMs,
				fetcher: latestFetcher,
				compare: latestCompare,
				checkImmediately,
				pauseWhenHidden,
				refetchOnWindowFocus,
				refetchOnVisibilityChange,
				refetchOnReconnect,
				getWindow,
				now: latestNow,
			}),
		[
			currentVersion,
			endpoint,
			intervalMs,
			minIntervalMs,
			latestFetcher,
			latestCompare,
			checkImmediately,
			pauseWhenHidden,
			refetchOnWindowFocus,
			refetchOnVisibilityChange,
			refetchOnReconnect,
			getWindow,
			latestNow,
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
