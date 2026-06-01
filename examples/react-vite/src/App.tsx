import { useVersionCheck } from "@almeidx/version-check-react";

const currentVersion = import.meta.env.VITE_VERSION_CHECK_BUILD_ID ?? __VERSION_CHECK_BUILD_ID__;

function refreshPage() {
	window.location.reload();
}

export function App() {
	const versionCheck = useVersionCheck({
		currentVersion,
		intervalMs: 30_000,
	});

	return (
		<main>
			<h1>React Vite version check</h1>
			<p>Current build: {currentVersion}</p>
			<p>Status: {versionCheck.status}</p>
			{versionCheck.updateAvailable ? (
				<output className="update">
					<span>New version available.</span>
					<button type="button" onClick={refreshPage}>
						Refresh
					</button>
				</output>
			) : null}
		</main>
	);
}
