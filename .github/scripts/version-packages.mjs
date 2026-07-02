import { readFile, writeFile } from "node:fs/promises";

const bump = process.argv[2];
const prereleaseTag = process.argv[3] || "alpha";
const supportedBumps = ["patch", "minor", "major", "prerelease"];

if (!supportedBumps.includes(bump)) {
	console.error("Usage: node .github/scripts/version-packages.mjs <patch|minor|major|prerelease> [prerelease-tag]");
	process.exit(1);
}

const packageJsonPaths = [
	"package.json",
	"packages/core/package.json",
	"packages/react/package.json",
	"packages/next/package.json",
	"packages/vue/package.json",
	"packages/vite/package.json",
];

function parseVersion(version) {
	const match = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<preid>[0-9A-Za-z-]+)\.(?<prenumber>\d+))?$/.exec(
		version,
	);

	if (match?.groups === undefined) {
		throw new Error(`Unsupported version: ${version}`);
	}

	return {
		major: Number(match.groups.major),
		minor: Number(match.groups.minor),
		patch: Number(match.groups.patch),
		preid: match.groups.preid,
		prenumber: match.groups.prenumber === undefined ? undefined : Number(match.groups.prenumber),
	};
}

function formatVersion(version) {
	const base = `${version.major}.${version.minor}.${version.patch}`;
	if (version.preid === undefined) return base;
	return `${base}-${version.preid}.${version.prenumber ?? 0}`;
}

function bumpVersion(currentVersion) {
	const current = parseVersion(currentVersion);

	if (bump === "major") {
		return formatVersion({ major: current.major + 1, minor: 0, patch: 0 });
	}

	if (bump === "minor") {
		return formatVersion({ major: current.major, minor: current.minor + 1, patch: 0 });
	}

	if (bump === "patch") {
		return formatVersion({
			major: current.major,
			minor: current.minor,
			patch: current.patch + 1,
		});
	}

	if (current.preid === prereleaseTag && current.prenumber !== undefined) {
		return formatVersion({
			major: current.major,
			minor: current.minor,
			patch: current.patch,
			preid: prereleaseTag,
			prenumber: current.prenumber + 1,
		});
	}

	return formatVersion({
		major: current.major,
		minor: current.minor,
		patch: current.patch + 1,
		preid: prereleaseTag,
		prenumber: 0,
	});
}

const rootPackageJson = JSON.parse(await readFile("packages/core/package.json", "utf8"));
const nextVersion = bumpVersion(rootPackageJson.version);

for (const packageJsonPath of packageJsonPaths) {
	const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
	packageJson.version = nextVersion;
	await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`);
}

console.log(nextVersion);
