"use client";

import { useNextVersionCheck } from "@almeidx/version-check-next/client";

export function VersionBanner({ initialVersion }: { readonly initialVersion: string }) {
	const versionCheck = useNextVersionCheck({
		currentVersion: { buildId: initialVersion },
		intervalMs: 30_000,
	});

	if (!versionCheck.updateAvailable) return null;

	return (
		<output className="update">
			<span>New version available.</span>
			<button type="button" onClick={versionCheck.reload}>
				Refresh
			</button>
		</output>
	);
}
