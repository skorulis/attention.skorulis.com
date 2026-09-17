import fs from "node:fs";
import path from "node:path";
import {
  listAccounts,
  listAllPosts,
  listFollowerSnapshots,
  listPostSnapshots,
  listPostsForAccount,
  openDb,
  type FollowerPoint,
  type MetricPoint,
  type PostRow,
} from "./db.js";

const DEFAULT_DB_PATH = path.resolve("data/attention.sqlite");
const DEFAULT_OUT_DIR = path.resolve("web/public/data");
const SPARKLINE_DAYS = 30;
const TEXT_SNIPPET_LEN = 120;

export interface IndexAccountExport {
  id: string;
  platform: string;
  handle: string;
  followers: number | null;
  updatedAt: string;
  followerSeries: FollowerPoint[];
}

export interface IndexExport {
  exportedAt: string;
  accounts: IndexAccountExport[];
}

export interface PostSummaryExport {
  id: number;
  platform: string;
  platformPostId: string;
  url: string | null;
  text: string | null;
  postedAt: string;
  likes: number | null;
  views: number | null;
  comments: number | null;
  reposts: number | null;
  quotes: number | null;
}

export interface AccountExport {
  id: string;
  platform: string;
  handle: string;
  followers: number | null;
  updatedAt: string;
  followerSeries: FollowerPoint[];
  posts: PostSummaryExport[];
}

export interface PostExport {
  id: number;
  accountId: string;
  platform: string;
  platformPostId: string;
  url: string | null;
  text: string | null;
  postedAt: string;
  likes: number | null;
  views: number | null;
  comments: number | null;
  reposts: number | null;
  quotes: number | null;
  series: MetricPoint[];
}

function snippet(text: string | null): string | null {
  if (text === null) {
    return null;
  }
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= TEXT_SNIPPET_LEN) {
    return trimmed;
  }
  return `${trimmed.slice(0, TEXT_SNIPPET_LEN - 1)}…`;
}

function toPostSummary(post: PostRow): PostSummaryExport {
  return {
    id: post.id,
    platform: post.platform,
    platformPostId: post.platformPostId,
    url: post.url,
    text: snippet(post.text),
    postedAt: post.postedAt,
    likes: post.likes,
    views: post.views,
    comments: post.comments,
    reposts: post.reposts,
    quotes: post.quotes,
  };
}

function lastNPoints(series: FollowerPoint[], n: number): FollowerPoint[] {
  if (series.length <= n) {
    return series;
  }
  return series.slice(series.length - n);
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function clearDirContents(dir: string): void {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".gitkeep") {
      continue;
    }
    const full = path.join(dir, entry.name);
    fs.rmSync(full, { recursive: true, force: true });
  }
}

export function exportSiteData(
  dbPath = DEFAULT_DB_PATH,
  outDir = DEFAULT_OUT_DIR,
): { accounts: number; posts: number } {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Missing database at ${dbPath}. Run npm run sync first.`);
  }

  const db = openDb(dbPath);
  try {
    clearDirContents(outDir);
    fs.mkdirSync(path.join(outDir, "accounts"), { recursive: true });
    fs.mkdirSync(path.join(outDir, "posts"), { recursive: true });

    const accounts = listAccounts(db);
    const exportedAt = new Date().toISOString();

    const index: IndexExport = {
      exportedAt,
      accounts: accounts.map((account) => {
        const followerSeries = listFollowerSnapshots(db, account.id);
        return {
          id: account.id,
          platform: account.platform,
          handle: account.handle,
          followers: account.followers,
          updatedAt: account.updatedAt,
          followerSeries: lastNPoints(followerSeries, SPARKLINE_DAYS),
        };
      }),
    };
    writeJson(path.join(outDir, "index.json"), index);

    for (const account of accounts) {
      const followerSeries = listFollowerSnapshots(db, account.id);
      const posts = listPostsForAccount(db, account.id).map(toPostSummary);
      const payload: AccountExport = {
        id: account.id,
        platform: account.platform,
        handle: account.handle,
        followers: account.followers,
        updatedAt: account.updatedAt,
        followerSeries,
        posts,
      };
      writeJson(path.join(outDir, "accounts", `${account.id}.json`), payload);
    }

    const allPosts = listAllPosts(db);
    for (const post of allPosts) {
      const payload: PostExport = {
        id: post.id,
        accountId: post.accountId,
        platform: post.platform,
        platformPostId: post.platformPostId,
        url: post.url,
        text: post.text,
        postedAt: post.postedAt,
        likes: post.likes,
        views: post.views,
        comments: post.comments,
        reposts: post.reposts,
        quotes: post.quotes,
        series: listPostSnapshots(db, post.id),
      };
      writeJson(path.join(outDir, "posts", `${post.id}.json`), payload);
    }

    return { accounts: accounts.length, posts: allPosts.length };
  } finally {
    db.close();
  }
}
