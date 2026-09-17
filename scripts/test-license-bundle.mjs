import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const licensesRoot = join(projectRoot, "public", "licenses");
const bundle = await readFile(
  join(licensesRoot, "THIRD_PARTY_LICENSES.txt"),
  "utf8",
);
const lgpl = await readFile(
  join(licensesRoot, "Nuked-OPN2-LGPL-2.1.txt"),
  "utf8",
);

for (const requiredText of [
  "Nuked-OPN2",
  "GNU LESSER GENERAL PUBLIC LICENSE",
  "React",
  "React DOM",
  "Scheduler",
  "Lucide React",
  "Feather",
]) {
  if (!bundle.includes(requiredText)) {
    throw new Error(`Missing third-party license notice: ${requiredText}`);
  }
}

if (!lgpl.includes("Version 2.1, February 1999")) {
  throw new Error("The deployed Nuked-OPN2 LGPL text is incomplete");
}

console.log("Third-party license bundle check passed");
