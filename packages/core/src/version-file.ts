/**
 * File name of the version JSON written by the `version-check` CLI and the Vite plugin.
 */
export const versionFileName = "version.json";

/**
 * Endpoint polled for the deployment version.
 */
export const defaultVersionEndpoint = `/${versionFileName}`;

/**
 * `Cache-Control` header value for responses serving a {@link BuildIdPayload}.
 */
export const versionCacheControl = "no-store, no-cache, must-revalidate";

/**
 * JSON payload served at the version endpoint.
 */
export type BuildIdPayload = {
	/** The deployment build id. */
	readonly buildId: string;
};

/** Creates the JSON content written to `version.json`. */
export function createVersionFileContent(buildId: string): string {
	return `${JSON.stringify({ buildId } satisfies BuildIdPayload, null, "\t")}\n`;
}
