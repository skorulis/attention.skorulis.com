import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { beersPath, monthDir, publicDir } from "./paths.js";
import type { Beer } from "./types.js";

const SITE = "https://bigalbumofbeers.com";
const CONCURRENCY = 8;
/** The list is newest first; stop after this many consecutive beers older than the month. */
const STOP_AFTER_OLDER = 8;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  ndash: "–",
  mdash: "—",
};

function decode(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match);
}

function clean(html: string): string {
  return decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.text();
}

export function listSlugs(html: string): string[] {
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/href="\/beer\/([^"]+)\.html"/g)) {
    const slug = match[1]!;
    if (!seen.has(slug)) {
      seen.add(slug);
      slugs.push(slug);
    }
  }
  return slugs;
}

interface DetailPage extends Omit<Beer, "image"> {
  imageUrl: string;
}

export function parseDetail(slug: string, html: string): DetailPage | null {
  const name = html.match(/<span class="name">([\s\S]*?)<\/span>/)?.[1];
  const addedOn = html.match(/Added on:\s*(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!name || !addedOn) return null;

  const main = html.match(/<div class="main-container">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const heading = clean(main.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? "");
  const ratingMatch = heading.match(/(\d+(?:\.\d+)?)\/10\s*$/);
  const note = ratingMatch ? heading.slice(0, ratingMatch.index).trim() : heading;

  const field = (label: string) => {
    const value = main.match(new RegExp(`<p>${label}:\\s*([\\s\\S]*?)</p>`))?.[1];
    return value ? clean(value) || null : null;
  };

  const imagePath = main.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? `/img/list/${slug}.jpeg`;

  return {
    slug,
    name: clean(name),
    note,
    rating: ratingMatch ? Number(ratingMatch[1]) : null,
    brewery: field("Brewery"),
    country: field("Country"),
    style: field("Style"),
    addedOn,
    imageUrl: new URL(imagePath, SITE).toString(),
  };
}

async function downloadImage(url: string, month: string, slug: string): Promise<string> {
  const ext = url.match(/\.(jpe?g|png|webp)$/i)?.[1]?.toLowerCase() ?? "jpeg";
  const relative = `${month}/${slug}.${ext}`;
  const target = join(publicDir, relative);
  if (!existsSync(target)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
  }
  return relative;
}

export async function fetchMonth(month: string): Promise<Beer[]> {
  const listHtml = await getText(`${SITE}/beers/`);
  const slugs = listSlugs(listHtml);
  const pages: DetailPage[] = [];
  let olderStreak = 0;

  for (let i = 0; i < slugs.length && olderStreak < STOP_AFTER_OLDER; i += CONCURRENCY) {
    const batch = slugs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (slug) => parseDetail(slug, await getText(`${SITE}/beer/${slug}.html`))),
    );
    for (const page of results) {
      if (!page) continue;
      const pageMonth = page.addedOn.slice(0, 7);
      if (pageMonth < month) {
        olderStreak++;
      } else {
        olderStreak = 0;
        if (pageMonth === month) pages.push(page);
      }
    }
  }

  await mkdir(join(publicDir, month), { recursive: true });
  await mkdir(monthDir(month), { recursive: true });

  const beers: Beer[] = [];
  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const batch = pages.slice(i, i + CONCURRENCY);
    const downloaded = await Promise.all(
      batch.map(async ({ imageUrl, ...page }) => ({
        ...page,
        image: await downloadImage(imageUrl, month, page.slug),
      })),
    );
    beers.push(...downloaded);
  }

  await writeFile(beersPath(month), JSON.stringify(beers, null, 2) + "\n");
  return beers;
}
