import { blueskyAdapter } from "./bluesky.js";
import type { PlatformAdapter } from "./types.js";

const adapters: Record<string, PlatformAdapter> = {
  [blueskyAdapter.platform]: blueskyAdapter,
};

export function getAdapter(platform: string): PlatformAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return adapter;
}
