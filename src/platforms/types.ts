import type { AccountConfig } from "../config.js";

export interface NormalizedPost {
  platformPostId: string;
  url: string | null;
  text: string | null;
  postedAt: Date;
  likes: number | null;
  views: number | null;
  comments: number | null;
  reposts: number | null;
  quotes: number | null;
}

export interface FetchResult {
  followers: number | null;
  posts: NormalizedPost[];
}

export interface FetchOptions {
  recentDays: number;
}

export interface PlatformAdapter {
  platform: string;
  fetchAccount(account: AccountConfig, options: FetchOptions): Promise<FetchResult>;
}
