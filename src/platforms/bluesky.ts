import { AtpAgent } from "@atproto/api";
import type { AccountConfig } from "../config.js";
import type { FetchOptions, FetchResult, NormalizedPost, PlatformAdapter } from "./types.js";

const PUBLIC_APPVIEW = "https://public.api.bsky.app";
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export const blueskyAdapter: PlatformAdapter = {
  platform: "bluesky",
  fetchAccount: fetchBlueskyAccount,
};

async function fetchBlueskyAccount(
  account: AccountConfig,
  options: FetchOptions,
): Promise<FetchResult> {
  const agent = new AtpAgent({ service: PUBLIC_APPVIEW });
  const { data: profile } = await agent.getProfile({ actor: account.handle });
  const did = profile.did;
  const followers = profile.followersCount ?? null;
  const cutoffMs = Date.now() - options.recentDays * 24 * 60 * 60 * 1000;

  const posts: NormalizedPost[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data } = await agent.getAuthorFeed({
      actor: account.handle,
      filter: "posts_no_replies",
      includePins: false,
      limit: PAGE_SIZE,
      cursor,
    });

    if (data.feed.length === 0) {
      break;
    }

    let hitCutoff = false;
    for (const item of data.feed) {
      if (item.reason) {
        continue;
      }
      if (item.post.author.did !== did) {
        continue;
      }

      const postedAt = getCreatedAt(item.post.record);
      if (!postedAt) {
        continue;
      }
      if (postedAt.getTime() < cutoffMs) {
        hitCutoff = true;
        break;
      }

      posts.push(normalizePost(item.post, postedAt));
    }

    if (hitCutoff || !data.cursor) {
      break;
    }
    cursor = data.cursor;
  }

  return { followers, posts };
}

function normalizePost(
  post: {
    uri: string;
    likeCount?: number;
    replyCount?: number;
    repostCount?: number;
    quoteCount?: number;
    author: { handle: string };
    record: { [_ in string]: unknown };
  },
  postedAt: Date,
): NormalizedPost {
  return {
    platformPostId: post.uri,
    url: bskyPostUrl(post.author.handle, post.uri),
    text: getPostText(post.record),
    postedAt,
    likes: post.likeCount ?? null,
    views: null,
    comments: post.replyCount ?? null,
    reposts: post.repostCount ?? null,
    quotes: post.quoteCount ?? null,
  };
}

function bskyPostUrl(handle: string, uri: string): string | null {
  const rkey = uri.split("/").pop();
  if (!rkey) {
    return null;
  }
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

function getCreatedAt(record: unknown): Date | null {
  if (!record || typeof record !== "object" || !("createdAt" in record)) {
    return null;
  }
  if (typeof record.createdAt !== "string") {
    return null;
  }
  const postedAt = new Date(record.createdAt);
  return Number.isNaN(postedAt.getTime()) ? null : postedAt;
}

function getPostText(record: unknown): string | null {
  if (!record || typeof record !== "object" || !("text" in record)) {
    return null;
  }
  return typeof record.text === "string" ? record.text : null;
}
