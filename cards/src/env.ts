import { existsSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./paths.js";

export function loadEnv(): void {
  const path = join(repoRoot, ".env");
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
