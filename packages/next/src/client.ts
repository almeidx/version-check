"use client";

import type { VersionPayload } from "@almeidx/version-check";
import { useVersionCheck, type UseVersionCheckOptions, type UseVersionCheckResult } from "@almeidx/version-check-react";
import type { NextVersionPayload } from "./index.js";

export type UseNextVersionCheckOptions<TLatest extends VersionPayload = NextVersionPayload> = Omit<
	UseVersionCheckOptions<TLatest>,
	"endpoint"
> & {
	readonly endpoint?: string | URL;
};

export function useNextVersionCheck<TLatest extends VersionPayload = NextVersionPayload>(
	options: UseNextVersionCheckOptions<TLatest>,
): UseVersionCheckResult<TLatest> {
	return useVersionCheck<TLatest>({
		endpoint: "/api/version",
		...options,
	});
}
