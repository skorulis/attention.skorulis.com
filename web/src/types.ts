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

export interface IndexAccount {
  id: string;
  platform: string;
  handle: string;
  followers: number | null;
  updatedAt: string;
  followerSeries: FollowerPoint[];
}

export interface IndexData {
  exportedAt: string;
  accounts: IndexAccount[];
}

export interface PostSummary {
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

export interface AccountData {
  id: string;
  platform: string;
  handle: string;
  followers: number | null;
  updatedAt: string;
  followerSeries: FollowerPoint[];
  posts: PostSummary[];
}

export interface PostData {
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

export interface ExperimentArm {
  label: string;
  postIds: number[];
}

export interface ExperimentData {
  name: string;
  introduction: string;
  results: string;
  arms: ExperimentArm[];
}

export interface ExperimentIndexEntry {
  slug: string;
  name: string;
}

export interface ExperimentIndex {
  experiments: ExperimentIndexEntry[];
}
