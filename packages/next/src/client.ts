"use client";

export * from "@almeidx/version-check";

import type { VersionPayload } from "@almeidx/version-check";
import { useVersionCheck, type UseVersionCheckOptions, type UseVersionCheckResult } from "@almeidx/version-check-react";
import type { NextVersionPayload } from "./index.js";

/** Options for {@link useNextVersionCheck}: {@link UseVersionCheckOptions} with `endpoint` defaulting to `/api/version`. */
export type UseNextVersionCheckOptions<TLatest extends VersionPayload = NextVersionPayload> = Omit<
	UseVersionCheckOptions<TLatest>,
	"endpoint"
> & {
	/**
	 * Endpoint serving the build id.
	 *
	 * @defaultValue `"/api/version"`
	 */
	readonly endpoint?: string | URL | undefined;
};

/**
 * Next.js client hook wrapping {@link useVersionCheck} with the endpoint defaulting to `/api/version`,
 * matching {@link createNextVersionHandler}.
 */
export function useNextVersionCheck<TLatest extends VersionPayload = NextVersionPayload>(
	options: UseNextVersionCheckOptions<TLatest>,
): UseVersionCheckResult<TLatest> {
	return useVersionCheck<TLatest>({
		endpoint: "/api/version",
		...options,
	});
}
