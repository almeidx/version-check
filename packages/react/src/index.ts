"use client";

import {
	createVersionChecker,
	reloadPage,
	type VersionCheckOptions,
	type VersionCheckState,
	type VersionChecker,
	type VersionPayload,
} from "@almeidx/version-check";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

export type UseVersionCheckOptions<TLatest extends VersionPayload = VersionPayload> = VersionCheckOptions<TLatest>;

export type UseVersionCheckResult<TLatest extends VersionPayload = VersionPayload> = VersionCheckState<TLatest> & {
	readonly checker: VersionChecker<TLatest>;
	readonly check: () => Promise<VersionCheckState<TLatest>>;
	readonly start: () => void;
	readonly stop: () => void;
	readonly reload: () => void;
};

export function useVersionCheck<TLatest extends VersionPayload = VersionPayload>(
	options: UseVersionCheckOptions<TLatest>,
): UseVersionCheckResult<TLatest> {
	const { autoStart } = options;
	const [checker] = useState(() =>
		createVersionChecker<TLatest>({
			...options,
			autoStart: false,
		}),
	);

	const subscribe = useCallback((onStoreChange: () => void) => checker.subscribe(() => onStoreChange()), [checker]);
	const getSnapshot = useCallback(() => checker.getState(), [checker]);
	const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	useEffect(() => {
		if (autoStart !== false) {
			checker.start();
		}

		return () => {
			checker.stop();
		};
	}, [checker, autoStart]);

	const check = useCallback(() => checker.check(), [checker]);
	const start = useCallback(() => checker.start(), [checker]);
	const stop = useCallback(() => checker.stop(), [checker]);
	const reload = useCallback(() => reloadPage(), []);

	return useMemo(
		() => ({
			...state,
			checker,
			check,
			start,
			stop,
			reload,
		}),
		[state, checker, check, start, stop, reload],
	);
}
