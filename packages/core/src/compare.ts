import { resolveVersionId, type VersionPayload } from "./version-payload.js";

/**
 * Arguments passed to a {@link VersionComparator}.
 */
export interface VersionCompareContext<TLatest extends VersionPayload = VersionPayload> {
	/**
	 * The version that rendered the current page ({@link VersionCheckOptions.currentVersion}).
	 */
	readonly currentVersion: VersionPayload;
	/**
	 * The latest version returned by the fetcher.
	 */
	readonly latestVersion: TLatest;
}

/**
 * Decides whether `latestVersion` is an update over `currentVersion`. Return `true` when an update is
 * available. Defaults to comparing the resolved ids for inequality — see {@link isUpdateAvailable}.
 */
export type VersionComparator<TLatest extends VersionPayload = VersionPayload> = (
	context: VersionCompareContext<TLatest>,
) => boolean;

/**
 * Determines whether `latestVersion` is an update over `currentVersion`.
 *
 * When `compare` is provided it decides the result; otherwise the resolved ids
 * (see {@link resolveVersionId}) are compared for inequality.
 *
 * @returns `true` if an update is available.
 */
export function isUpdateAvailable<TLatest extends VersionPayload>(
	currentVersion: VersionPayload,
	latestVersion: TLatest,
	compare?: VersionComparator<TLatest>,
): boolean {
	if (compare !== undefined) {
		return compare({ currentVersion, latestVersion });
	}

	return resolveVersionId(currentVersion) !== resolveVersionId(latestVersion);
}
