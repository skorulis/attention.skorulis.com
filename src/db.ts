import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export interface AccountRecord {
  id: string;
  platform: string;
  handle: string;
  followers: number | null;
}

export interface PostRecord {
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
}

export function openDb(dbPath: string): Database.Database {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      handle TEXT NOT NULL,
      followers INTEGER,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY,
      account_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      platform_post_id TEXT NOT NULL,
      url TEXT,
      text TEXT,
      posted_at TEXT NOT NULL,
      likes INTEGER,
      views INTEGER,
      comments INTEGER,
      reposts INTEGER,
      quotes INTEGER,
      fetched_at TEXT NOT NULL,
      UNIQUE (platform, platform_post_id),
      FOREIGN KEY (account_id) REFERENCES accounts (id)
    );

    CREATE TABLE IF NOT EXISTS post_snapshots (
      id INTEGER PRIMARY KEY,
      post_id INTEGER NOT NULL,
      likes INTEGER,
      views INTEGER,
      comments INTEGER,
      reposts INTEGER,
      quotes INTEGER,
      recorded_at TEXT NOT NULL,
      recorded_on TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts (id)
    );

    CREATE TABLE IF NOT EXISTS follower_snapshots (
      id INTEGER PRIMARY KEY,
      account_id TEXT NOT NULL,
      followers INTEGER,
      recorded_at TEXT NOT NULL,
      recorded_on TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts (id)
    );
  `);

  addColumnIfMissing(db, "post_snapshots", "recorded_on", "TEXT");
  addColumnIfMissing(db, "follower_snapshots", "recorded_on", "TEXT");

  db.exec(`
    UPDATE post_snapshots
    SET recorded_on = substr(recorded_at, 1, 10)
    WHERE recorded_on IS NULL;

    UPDATE follower_snapshots
    SET recorded_on = substr(recorded_at, 1, 10)
    WHERE recorded_on IS NULL;

    DELETE FROM post_snapshots
    WHERE id NOT IN (
      SELECT MAX(id) FROM post_snapshots GROUP BY post_id, recorded_on
    );

    DELETE FROM follower_snapshots
    WHERE id NOT IN (
      SELECT MAX(id) FROM follower_snapshots GROUP BY account_id, recorded_on
    );

    CREATE UNIQUE INDEX IF NOT EXISTS post_snapshots_post_day
      ON post_snapshots (post_id, recorded_on);

    CREATE UNIQUE INDEX IF NOT EXISTS follower_snapshots_account_day
      ON follower_snapshots (account_id, recorded_on);
  `);
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  type: string,
): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (columns.some((entry) => entry.name === column)) {
    return;
  }
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
}

function snapshotDay(recordedAt: string): string {
  return recordedAt.slice(0, 10);
}

export function saveAccountFetch(
  db: Database.Database,
  account: AccountRecord,
  posts: PostRecord[],
): void {
  const recordedAt = new Date().toISOString();
  const run = db.transaction(() => {
    upsertAccount(db, account, recordedAt);
    insertFollowerSnapshot(db, account.id, account.followers, recordedAt);
    for (const post of posts) {
      const postId = upsertPost(db, post, recordedAt);
      insertPostSnapshot(db, postId, post, recordedAt);
    }
  });
  run();
}

function upsertAccount(
  db: Database.Database,
  account: AccountRecord,
  updatedAt: string,
): void {
  db.prepare(
    `
    INSERT INTO accounts (id, platform, handle, followers, updated_at)
    VALUES (@id, @platform, @handle, @followers, @updatedAt)
    ON CONFLICT (id) DO UPDATE SET
      platform = excluded.platform,
      handle = excluded.handle,
      followers = excluded.followers,
      updated_at = excluded.updated_at
    `,
  ).run({
    id: account.id,
    platform: account.platform,
    handle: account.handle,
    followers: account.followers,
    updatedAt,
  });
}

function insertFollowerSnapshot(
  db: Database.Database,
  accountId: string,
  followers: number | null,
  recordedAt: string,
): void {
  db.prepare(
    `
    INSERT INTO follower_snapshots (account_id, followers, recorded_at, recorded_on)
    VALUES (@accountId, @followers, @recordedAt, @recordedOn)
    ON CONFLICT (account_id, recorded_on) DO UPDATE SET
      followers = excluded.followers,
      recorded_at = excluded.recorded_at
    `,
  ).run({
    accountId,
    followers,
    recordedAt,
    recordedOn: snapshotDay(recordedAt),
  });
}

function upsertPost(db: Database.Database, post: PostRecord, fetchedAt: string): number {
  db.prepare(
    `
    INSERT INTO posts (
      account_id, platform, platform_post_id, url, text, posted_at,
      likes, views, comments, reposts, quotes, fetched_at
    ) VALUES (
      @accountId, @platform, @platformPostId, @url, @text, @postedAt,
      @likes, @views, @comments, @reposts, @quotes, @fetchedAt
    )
    ON CONFLICT (platform, platform_post_id) DO UPDATE SET
      account_id = excluded.account_id,
      url = excluded.url,
      text = excluded.text,
      posted_at = excluded.posted_at,
      likes = excluded.likes,
      views = excluded.views,
      comments = excluded.comments,
      reposts = excluded.reposts,
      quotes = excluded.quotes,
      fetched_at = excluded.fetched_at
    `,
  ).run({
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
    fetchedAt,
  });

  const row = db
    .prepare(`SELECT id FROM posts WHERE platform = ? AND platform_post_id = ?`)
    .get(post.platform, post.platformPostId) as { id: number } | undefined;

  if (!row) {
    throw new Error(`Failed to load post id for ${post.platform} ${post.platformPostId}`);
  }

  return row.id;
}

function insertPostSnapshot(
  db: Database.Database,
  postId: number,
  post: PostRecord,
  recordedAt: string,
): void {
  db.prepare(
    `
    INSERT INTO post_snapshots (post_id, likes, views, comments, reposts, quotes, recorded_at, recorded_on)
    VALUES (@postId, @likes, @views, @comments, @reposts, @quotes, @recordedAt, @recordedOn)
    ON CONFLICT (post_id, recorded_on) DO UPDATE SET
      likes = excluded.likes,
      views = excluded.views,
      comments = excluded.comments,
      reposts = excluded.reposts,
      quotes = excluded.quotes,
      recorded_at = excluded.recorded_at
    `,
  ).run({
    postId,
    likes: post.likes,
    views: post.views,
    comments: post.comments,
    reposts: post.reposts,
    quotes: post.quotes,
    recordedAt,
    recordedOn: snapshotDay(recordedAt),
  });
}

export interface FollowerPoint {
  recordedOn: string;
  followers: number | null;
}

export interface MetricPoint {
  recordedOn: string;
  likes: number | null;
  views: number | null;
  comments: number | null;
  reposts: number | null;
  quotes: number | null;
}

export interface AccountRow {
  id: string;
  platform: string;
  handle: string;
  followers: number | null;
  updatedAt: string;
}

export interface PostRow {
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
}

export function listAccounts(db: Database.Database): AccountRow[] {
  const rows = db
    .prepare(
      `
      SELECT id, platform, handle, followers, updated_at AS updatedAt
      FROM accounts
      ORDER BY handle COLLATE NOCASE
      `,
    )
    .all() as AccountRow[];
  return rows;
}

export function getAccount(db: Database.Database, accountId: string): AccountRow | undefined {
  return db
    .prepare(
      `
      SELECT id, platform, handle, followers, updated_at AS updatedAt
      FROM accounts
      WHERE id = ?
      `,
    )
    .get(accountId) as AccountRow | undefined;
}

export function listFollowerSnapshots(
  db: Database.Database,
  accountId: string,
): FollowerPoint[] {
  return db
    .prepare(
      `
      SELECT recorded_on AS recordedOn, followers
      FROM follower_snapshots
      WHERE account_id = ?
      ORDER BY recorded_on ASC
      `,
    )
    .all(accountId) as FollowerPoint[];
}

export function listPostsForAccount(db: Database.Database, accountId: string): PostRow[] {
  return db
    .prepare(
      `
      SELECT
        id,
        account_id AS accountId,
        platform,
        platform_post_id AS platformPostId,
        url,
        text,
        posted_at AS postedAt,
        likes,
        views,
        comments,
        reposts,
        quotes
      FROM posts
      WHERE account_id = ?
      ORDER BY posted_at DESC
      `,
    )
    .all(accountId) as PostRow[];
}

export function getPost(db: Database.Database, postId: number): PostRow | undefined {
  return db
    .prepare(
      `
      SELECT
        id,
        account_id AS accountId,
        platform,
        platform_post_id AS platformPostId,
        url,
        text,
        posted_at AS postedAt,
        likes,
        views,
        comments,
        reposts,
        quotes
      FROM posts
      WHERE id = ?
      `,
    )
    .get(postId) as PostRow | undefined;
}

export function listPostSnapshots(db: Database.Database, postId: number): MetricPoint[] {
  return db
    .prepare(
      `
      SELECT
        recorded_on AS recordedOn,
        likes,
        views,
        comments,
        reposts,
        quotes
      FROM post_snapshots
      WHERE post_id = ?
      ORDER BY recorded_on ASC
      `,
    )
    .all(postId) as MetricPoint[];
}

export function listAllPosts(db: Database.Database): PostRow[] {
  return db
    .prepare(
      `
      SELECT
        id,
        account_id AS accountId,
        platform,
        platform_post_id AS platformPostId,
        url,
        text,
        posted_at AS postedAt,
        likes,
        views,
        comments,
        reposts,
        quotes
      FROM posts
      ORDER BY posted_at DESC
      `,
    )
    .all() as PostRow[];
}
