import type { AccountData, IndexData, PostData } from "./types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url} (${res.status})`);
  }
  return (await res.json()) as T;
}

export function loadIndex(): Promise<IndexData> {
  return fetchJson<IndexData>("/data/index.json");
}

export function loadAccount(id: string): Promise<AccountData> {
  return fetchJson<AccountData>(`/data/accounts/${encodeURIComponent(id)}.json`);
}

export function loadPost(id: string): Promise<PostData> {
  return fetchJson<PostData>(`/data/posts/${encodeURIComponent(id)}.json`);
}
