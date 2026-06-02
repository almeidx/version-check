"use client";

import { useNextVersionCheck } from "@almeidx/version-check-next/client";

function refreshPage() {
	window.location.reload();
}

export function VersionBanner({ initialVersion }: { readonly initialVersion: string }) {
	const versionCheck = useNextVersionCheck({
		currentVersion: initialVersion,
		intervalMs: 30_000,
	});

	if (!versionCheck.updateAvailable) return null;

	return (
		<output className="update">
			<span>New version available.</span>
			<button type="button" onClick={refreshPage}>
				Refresh
			</button>
		</output>
	);
}
