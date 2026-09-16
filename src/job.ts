import type { Database } from "better-sqlite3";
import type { AppConfig } from "./config.js";
import { saveAccountFetch } from "./db.js";
import { getAdapter } from "./platforms/index.js";

export interface AccountSyncResult {
  accountId: string;
  platform: string;
  handle: string;
  followers: number | null;
  postsUpdated: number;
  error?: string;
}

export async function runSync(db: Database, config: AppConfig): Promise<AccountSyncResult[]> {
  const results: AccountSyncResult[] = [];

  for (const account of config.accounts) {
    try {
      const adapter = getAdapter(account.platform);
      const { followers, posts } = await adapter.fetchAccount(account, {
        recentDays: config.recentDays,
      });

      saveAccountFetch(
        db,
        {
          id: account.id,
          platform: account.platform,
          handle: account.handle,
          followers,
        },
        posts.map((post) => ({
          accountId: account.id,
          platform: account.platform,
          platformPostId: post.platformPostId,
          url: post.url,
          text: post.text,
          postedAt: post.postedAt.toISOString(),
          likes: post.likes,
          views: post.views,
          comments: post.comments,
          reposts: post.reposts,
          quotes: post.quotes,
        })),
      );

      results.push({
        accountId: account.id,
        platform: account.platform,
        handle: account.handle,
        followers,
        postsUpdated: posts.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        accountId: account.id,
        platform: account.platform,
        handle: account.handle,
        followers: null,
        postsUpdated: 0,
        error: message,
      });
    }
  }

  return results;
}
