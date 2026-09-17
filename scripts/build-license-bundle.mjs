import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(projectRoot, "public", "licenses");
const pinnedNukedCommit = "335747d78cb0abbc3b55b004e62dad9763140115";

const bundledPackages = [
  {
    packageName: "react",
    displayName: "React",
    source: "https://github.com/facebook/react",
  },
  {
    packageName: "react-dom",
    displayName: "React DOM",
    source: "https://github.com/facebook/react",
  },
  {
    packageName: "scheduler",
    displayName: "Scheduler",
    source: "https://github.com/facebook/react",
  },
  {
    packageName: "lucide-react",
    displayName: "Lucide React (including Feather-derived icon notices)",
    source: "https://github.com/lucide-icons/lucide",
  },
];

await mkdir(outputDir, { recursive: true });

const separator = `${"=".repeat(78)}\n`;
const sections = [
  "OPNZ THIRD-PARTY LICENSES\n",
  "This file is generated from the exact dependency licenses installed by npm.\n",
  "The corresponding application and Nuked-OPN2 source is available at:\n",
  "https://github.com/KG-NINJA/OPNZ\n\n",
  separator,
  "Nuked-OPN2\n",
  `Pinned commit: ${pinnedNukedCommit}\n`,
  "License: GNU Lesser General Public License v2.1 or later\n",
  `Source: https://github.com/nukeykt/Nuked-OPN2/tree/${pinnedNukedCommit}\n`,
  "Corresponding source in OPNZ: vendor/Nuked-OPN2/\n\n",
  await readFile(join(projectRoot, "vendor", "Nuked-OPN2", "LICENSE"), "utf8"),
  "\n\n",
];

for (const dependency of bundledPackages) {
  const packageRoot = join(projectRoot, "node_modules", dependency.packageName);
  const packageJson = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8"),
  );
  const license = await readFile(join(packageRoot, "LICENSE"), "utf8");

  sections.push(
    separator,
    `${dependency.displayName}\n`,
    `Package: ${dependency.packageName}@${packageJson.version}\n`,
    `License: ${packageJson.license}\n`,
    `Source: ${dependency.source}\n\n`,
    license.trim(),
    "\n\n",
  );
}

await writeFile(
  join(outputDir, "THIRD_PARTY_LICENSES.txt"),
  sections.join(""),
  "utf8",
);
await copyFile(
  join(projectRoot, "vendor", "Nuked-OPN2", "LICENSE"),
  join(outputDir, "Nuked-OPN2-LGPL-2.1.txt"),
);
await copyFile(
  join(projectRoot, "THIRD_PARTY_NOTICES.md"),
  join(outputDir, "THIRD_PARTY_NOTICES.md"),
);

console.log("Built public license and notice files");
