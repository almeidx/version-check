import { VersionCheckError } from "./version-check-error.js";
import type { VersionPayload } from "./version-payload.js";

/**
 * Arguments passed to a {@link VersionFetcher}.
 */
export interface VersionFetchContext {
	/**
	 * The endpoint to request ({@link VersionCheckOptions.endpoint}).
	 */
	readonly endpoint: string | URL;
	/**
	 * Aborted when the check is superseded or the checker stops; forward it to your request.
	 */
	readonly signal: AbortSignal;
	/**
	 * Extra request options ({@link VersionCheckOptions.requestInit}).
	 */
	readonly requestInit?: RequestInit | undefined;
	/**
	 * The `fetch` implementation to use ({@link VersionCheckOptions.fetch}), if provided.
	 */
	readonly fetch?: typeof fetch | undefined;
}

/**
 * Fetches the latest version payload from the endpoint.
 *
 * @defaultValue {@link fetchJsonVersion}
 */
export type VersionFetcher<TLatest extends VersionPayload = VersionPayload> = (
	context: VersionFetchContext,
) => Promise<TLatest>;

/**
 * Default {@link VersionFetcher}: requests the endpoint with `cache: "no-store"` and parses the JSON body.
 *
 * @throws {@link TypeError} If no `fetch` implementation is available.
 * @throws {@link VersionCheckError} If the response status is not ok.
 */
export async function fetchJsonVersion<TLatest extends VersionPayload = VersionPayload>(
	context: VersionFetchContext,
): Promise<TLatest> {
	const fetchImpl = context.fetch ?? globalThis.fetch;

	if (fetchImpl === undefined) {
		throw new TypeError("No fetch implementation is available.");
	}

	const response = await fetchImpl(context.endpoint, {
		...context.requestInit,
		cache: context.requestInit?.cache ?? "no-store",
		signal: context.signal,
	});

	if (!response.ok) {
		throw new VersionCheckError(response);
	}

	return (await response.json()) as TLatest;
}
