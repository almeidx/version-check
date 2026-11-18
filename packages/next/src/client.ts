"use client";

export * from "@almeidx/version-check";

import type { BuildIdPayload, VersionPayload } from "@almeidx/version-check";
import { useVersionCheck, type UseVersionCheckOptions, type UseVersionCheckResult } from "@almeidx/version-check-react";

/** Options for {@link useNextVersionCheck}: {@link UseVersionCheckOptions} with `endpoint` defaulting to `/api/version`. */
export type UseNextVersionCheckOptions<TLatest extends VersionPayload = BuildIdPayload> = Omit<
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
export function useNextVersionCheck<TLatest extends VersionPayload = BuildIdPayload>(
	options: UseNextVersionCheckOptions<TLatest>,
): UseVersionCheckResult<TLatest> {
	return useVersionCheck<TLatest>({
		...options,
		endpoint: options.endpoint ?? "/api/version",
	});
}
