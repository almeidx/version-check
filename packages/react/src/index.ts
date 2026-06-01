"use client";

export * from "@almeidx/version-check";

import {
	createVersionChecker,
	type VersionCheckOptions,
	type VersionCheckState,
	type VersionPayload,
} from "@almeidx/version-check";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type UseVersionCheckOptions<TLatest extends VersionPayload = VersionPayload> = Omit<
	VersionCheckOptions<TLatest>,
	"autoStart"
>;

export type UseVersionCheckResult<TLatest extends VersionPayload = VersionPayload> = VersionCheckState<TLatest>;

export function useVersionCheck<TLatest extends VersionPayload = VersionPayload>(
	options: UseVersionCheckOptions<TLatest>,
): UseVersionCheckResult<TLatest> {
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
		checker.start();

		return () => {
			checker.stop();
		};
	}, [checker]);

	return state;
}
