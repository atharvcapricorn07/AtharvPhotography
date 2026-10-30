// Kept so the old command still works: `node generate-photos.js`.
// Installs dependencies the first time, then runs the image build (same as `npm run photos`).
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
process.chdir(dir);
if (!fs.existsSync(path.join(dir, "node_modules", "sharp"))) {
  console.log("First run: installing image tools (one time only)...");
  execSync("npm install", { stdio: "inherit" });
}
execSync("node scripts/build-photos.mjs", { stdio: "inherit" });
