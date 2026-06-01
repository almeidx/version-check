import { getNextBuildId } from "@almeidx/version-check-next";
import { VersionBanner } from "./version-banner.js";

export default async function Page() {
	const buildId = await getNextBuildId();

	return (
		<main>
			<h1>Next version check</h1>
			<p>Current build: {buildId}</p>
			<VersionBanner initialVersion={buildId} />
		</main>
	);
}
