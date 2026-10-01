import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const reelRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
export const publicDir = join(reelRoot, "public");

export function monthDir(month: string): string {
  return join(reelRoot, "months", month);
}

export function outDir(month: string): string {
  return join(reelRoot, "out", month);
}

export function beersPath(month: string): string {
  return join(monthDir(month), "beers.json");
}

export function storyPath(month: string): string {
  return join(monthDir(month), "story.json");
}

/** Pointer the Studio Render button reads when `--props` is not applied. */
export const currentStoryPublicPath = join(publicDir, "current", "story.json");
