import path from "node:path";
import { exportSiteData } from "./export.js";

const outDir = path.resolve("web/public/data");

try {
  const result = exportSiteData();
  console.log(`Exported ${result.accounts} accounts and ${result.posts} posts to ${outDir}`);
} catch (err: unknown) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
