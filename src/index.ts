import path from "node:path";
import { loadConfig } from "./config.js";
import { openDb } from "./db.js";
import { runSync } from "./job.js";

const dbPath = path.resolve("data/attention.sqlite");

async function main(): Promise<void> {
  const config = loadConfig();
  const db = openDb(dbPath);

  try {
    const results = await runSync(db, config);
    let failed = 0;

    for (const result of results) {
      if (result.error) {
        failed += 1;
        console.error(
          `[${result.accountId}] ${result.platform} ${result.handle}: ERROR ${result.error}`,
        );
        continue;
      }

      const followerLabel = result.followers === null ? "?" : String(result.followers);
      console.log(
        `[${result.accountId}] ${result.platform} ${result.handle}: ${followerLabel} followers, ${result.postsUpdated} posts updated`,
      );
    }

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    db.close();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
