import type { AccountConfig } from "../config.js";
import type { FetchOptions, FetchResult, NormalizedPost, PlatformAdapter } from "./types.js";

const API_VERSION = "v23.0";
const PAGE_SIZE = 50;
const MAX_PAGES = 10;
const INSIGHTS_CONCURRENCY = 4;

const CORE_MEDIA_FIELDS = [
  "id",
  "caption",
  "timestamp",
  "permalink",
  "media_type",
  "media_product_type",
  "like_count",
  "comments_count",
].join(",");

const FULL_MEDIA_FIELDS = `${CORE_MEDIA_FIELDS},shares_count,reposts_count,view_count,total_views_count`;

export const instagramAdapter: PlatformAdapter = {
  platform: "instagram",
  fetchAccount: fetchInstagramAccount,
};

async function fetchInstagramAccount(
  account: AccountConfig,
  options: FetchOptions,
): Promise<FetchResult> {
  const accessToken = account.accessToken;
  if (!accessToken) {
    throw new Error(`Instagram account ${account.id} is missing accessToken`);
  }

  const graph = account.graph ?? "instagram";
  const base = graphBase(graph);
  const profile = await fetchProfile(base, accessToken, account.userId, graph);
  const posts = await fetchRecentPosts(base, accessToken, profile.id, options.recentDays);

  return { followers: profile.followers, posts };
}

function graphBase(graph: "instagram" | "facebook"): string {
  return graph === "facebook" ? "https://graph.facebook.com" : "https://graph.instagram.com";
}

async function fetchProfile(
  base: string,
  accessToken: string,
  userId: string | undefined,
  graph: "instagram" | "facebook",
): Promise<{ id: string; followers: number | null }> {
  const pathId = userId ?? "me";
  if (graph === "facebook" && pathId === "me") {
    throw new Error(
      'Instagram accounts using graph "facebook" require userId (the IG professional account id)',
    );
  }

  const profile = await graphGet<GraphUser>(base, `/${pathId}`, accessToken, {
    fields: "id,user_id,username,followers_count",
  });

  return {
    id: userId ?? profile.user_id ?? profile.id,
    followers: typeof profile.followers_count === "number" ? profile.followers_count : null,
  };
}

async function fetchRecentPosts(
  base: string,
  accessToken: string,
  userId: string,
  recentDays: number,
): Promise<NormalizedPost[]> {
  const cutoffMs = Date.now() - recentDays * 24 * 60 * 60 * 1000;
  const media = await listRecentMedia(base, accessToken, userId, cutoffMs);
  const posts = media.map(normalizeMedia);
  await fillMissingInsights(base, accessToken, posts);
  return posts;
}

async function listRecentMedia(
  base: string,
  accessToken: string,
  userId: string,
  cutoffMs: number,
): Promise<GraphMedia[]> {
  try {
    return await paginateMedia(base, accessToken, userId, cutoffMs, FULL_MEDIA_FIELDS);
  } catch {
    return await paginateMedia(base, accessToken, userId, cutoffMs, CORE_MEDIA_FIELDS);
  }
}

async function paginateMedia(
  base: string,
  accessToken: string,
  userId: string,
  cutoffMs: number,
  fields: string,
): Promise<GraphMedia[]> {
  const items: GraphMedia[] = [];
  let after: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await graphGet<GraphMediaPage>(base, `/${userId}/media`, accessToken, {
      fields,
      limit: String(PAGE_SIZE),
      ...(after ? { after } : {}),
    });

    if (response.data.length === 0) {
      break;
    }

    let hitCutoff = false;
    for (const item of response.data) {
      if (item.media_product_type === "STORY") {
        continue;
      }
      const postedAt = parseTimestamp(item.timestamp);
      if (!postedAt) {
        continue;
      }
      if (postedAt.getTime() < cutoffMs) {
        hitCutoff = true;
        break;
      }
      items.push(item);
    }

    const nextAfter = response.paging?.cursors?.after;
    if (hitCutoff || !nextAfter) {
      break;
    }
    after = nextAfter;
  }

  return items;
}

function normalizeMedia(media: GraphMedia): NormalizedPost {
  const postedAt = parseTimestamp(media.timestamp);
  if (!postedAt) {
    throw new Error(`Instagram media ${media.id} is missing a timestamp`);
  }

  return {
    platformPostId: media.id,
    url: media.permalink ?? null,
    text: media.caption ?? null,
    postedAt,
    likes: media.like_count ?? null,
    views: media.view_count ?? media.total_views_count ?? null,
    comments: media.comments_count ?? null,
    reposts: media.reposts_count ?? media.shares_count ?? null,
    quotes: null,
  };
}

async function fillMissingInsights(
  base: string,
  accessToken: string,
  posts: NormalizedPost[],
): Promise<void> {
  const missing = posts.filter((post) => post.views === null || post.reposts === null);

  await mapPool(missing, INSIGHTS_CONCURRENCY, async (post) => {
    const insights = await fetchMediaInsights(base, accessToken, post.platformPostId);
    if (post.views === null) {
      post.views = insights.views;
    }
    if (post.reposts === null) {
      post.reposts = insights.reposts ?? insights.shares;
    }
  });
}

async function fetchMediaInsights(
  base: string,
  accessToken: string,
  mediaId: string,
): Promise<{ views: number | null; shares: number | null; reposts: number | null }> {
  const empty = { views: null, shares: null, reposts: null };
  const metricSets = ["views,shares,reposts", "views,shares", "views"];

  for (const metric of metricSets) {
    try {
      const response = await graphGet<GraphInsights>(base, `/${mediaId}/insights`, accessToken, {
        metric,
      });
      return {
        views: insightValue(response, "views"),
        shares: insightValue(response, "shares"),
        reposts: insightValue(response, "reposts"),
      };
    } catch {
      continue;
    }
  }

  return empty;
}

function insightValue(response: GraphInsights, name: string): number | null {
  const metric = response.data?.find((entry) => entry.name === name);
  if (!metric) {
    return null;
  }
  if (typeof metric.total_value?.value === "number") {
    return metric.total_value.value;
  }
  const value = metric.values?.[0]?.value;
  return typeof value === "number" ? value : null;
}

async function graphGet<T>(
  base: string,
  path: string,
  accessToken: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${base}/${API_VERSION}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  const body: unknown = await response.json().catch(() => null);
  const message = graphErrorMessage(body);

  if (!response.ok || message) {
    throw new Error(message ?? `Instagram API request failed (${response.status})`);
  }

  return body as T;
}

function graphErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("error" in body)) {
    return null;
  }
  const error = (body as { error?: { message?: unknown } }).error;
  if (!error || typeof error.message !== "string" || error.message.trim() === "") {
    return "Instagram API request failed";
  }
  return error.message;
}

function parseTimestamp(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const postedAt = new Date(value);
  return Number.isNaN(postedAt.getTime()) ? null : postedAt;
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const current = next;
      next += 1;
      const item = items[current];
      if (item !== undefined) {
        await fn(item);
      }
    }
  });
  await Promise.all(workers);
}

interface GraphUser {
  id: string;
  user_id?: string;
  username?: string;
  followers_count?: number;
}

interface GraphMedia {
  id: string;
  caption?: string;
  timestamp?: string;
  permalink?: string;
  media_type?: string;
  media_product_type?: string;
  like_count?: number;
  comments_count?: number;
  shares_count?: number;
  reposts_count?: number;
  view_count?: number;
  total_views_count?: number;
}

interface GraphMediaPage {
  data: GraphMedia[];
  paging?: {
    cursors?: {
      after?: string;
    };
  };
}

interface GraphInsights {
  data: Array<{
    name: string;
    values?: Array<{ value?: number }>;
    total_value?: { value?: number };
  }>;
}
