import { getNextBuildId } from "@almeidx/version-check-next";
import type { PropsWithChildren } from "react";
import { VersionBanner } from "./version-banner.js";
import "./style.css";

export const metadata = {
	title: "Next version check",
	description: "Example for @almeidx/version-check-next",
};

export default async function RootLayout({ children }: PropsWithChildren) {
	const buildId = await getNextBuildId();

	return (
		<html lang="en">
			<body>
				<VersionBanner initialVersion={buildId} />
				{children}
			</body>
		</html>
	);
}
