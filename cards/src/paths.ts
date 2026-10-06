import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const cardsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
export const repoRoot = join(cardsRoot, "..");
export const publicDir = join(cardsRoot, "public");

export const principlesJsonPath = join(repoRoot, "web/public/data/principles.json");

export function outDir(slug: string): string {
  return join(cardsRoot, "out", slug);
}

export function bgPath(slug: string, style: string): string {
  return join(outDir(slug), `${style}.bg.png`);
}

export function cardPath(slug: string, style: string): string {
  return join(outDir(slug), `${style}.png`);
}

export function publicBgPath(slug: string, style: string): string {
  return join(publicDir, "bg", `${slug}-${style}.png`);
}

export function publishDir(slug: string): string {
  return join(repoRoot, "web/public/principles", slug);
}
