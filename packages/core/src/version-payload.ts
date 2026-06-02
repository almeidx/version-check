// Object payload keys checked, in order, when resolving a deployment identity.
const versionIdKeys = ["version", "buildId", "id", "hash", "sha"] as const;

/**
 * A structured version payload. The deployment identity is taken from the first present, non-empty
 * string among `version`, `buildId`, `id`, `hash`, `sha` — see {@link resolveVersionId}.
 */
export interface VersionObject {
	readonly [key: string]: unknown;
}

/**
 * A deployment identity: a non-empty string, or a {@link VersionObject} carrying a recognised id key.
 */
export type VersionPayload = string | VersionObject;

/**
 * Resolves a {@link VersionPayload} to its deployment id string.
 *
 * For strings, returns the trimmed value. For objects, returns the first non-empty string among
 * `version`, `buildId`, `id`, `hash`, `sha`.
 *
 * @param version - The payload to resolve.
 * @returns The resolved, trimmed id.
 * @throws {@link TypeError} If the string is empty, or no recognised key holds a non-empty string.
 */
export function resolveVersionId(version: VersionPayload): string {
	if (typeof version === "string") {
		const id = version.trim();
		if (id.length > 0) return id;
		throw new TypeError("Version string must not be empty.");
	}

	for (const key of versionIdKeys) {
		const value = version[key];
		if (typeof value === "string" && value.trim().length > 0) {
			return value.trim();
		}
	}

	throw new TypeError(`Version payload must be a non-empty string or include one of: ${versionIdKeys.join(", ")}.`);
}
