import type { Beer, Highlight, Story } from "./types.js";

const MAX_COUNTDOWN = 5;
const MAX_QUOTE = 100;
const MAX_LONG_QUOTE = 170;
const PUNCHY =
  /\b(bad|worst|couldn’t|couldn't|never|would not|wouldn’t|delicious|surprisingly|way too|love|best|unique|funny|dehydrated|dense|skull)\b/i;

type Rated = Beer & { rating: number };

export function monthName(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(Date.UTC(year!, mon! - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

function shortCountry(country: string | null): string | null {
  return country ? country.split(" / ")[0]!.trim() : null;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max / 2 ? lastSpace : cut.length).replace(/[,.;:]$/, "")}…`;
}

function sentencesOf(note: string): string[] {
  return note
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

/** As many whole sentences as fit, falling back to a hard truncate of the first. */
export function longQuote(note: string): string {
  const sentences = sentencesOf(note);
  let text = "";
  for (const s of sentences) {
    const next = text ? `${text}${/[!?]$/.test(text) ? "" : "."} ${s}` : s;
    if (next.length > MAX_LONG_QUOTE) break;
    text = next;
  }
  return text || truncate(sentences[0] ?? "", MAX_LONG_QUOTE);
}

export function pickQuote(note: string): string {
  const sentences = sentencesOf(note);
  if (sentences.length === 0) return "";
  const score = (s: string) => (PUNCHY.test(s) ? 2 : 0) + (s.length >= 20 && s.length <= MAX_QUOTE ? 1 : 0);
  let best = sentences[0]!;
  for (const s of sentences) {
    if (score(s) > score(best)) best = s;
  }
  return truncate(best, MAX_QUOTE);
}

function toHighlight(beer: Rated): Highlight {
  return {
    slug: beer.slug,
    name: beer.name,
    brewery: beer.brewery,
    country: shortCountry(beer.country),
    style: beer.style,
    rating: beer.rating,
    quote: pickQuote(beer.note),
    longQuote: longQuote(beer.note),
    image: beer.image,
  };
}

function quoteStrength(note: string): number {
  return (PUNCHY.test(note) ? 2 : 0) + (note.length >= 60 ? 1 : 0);
}

/** Greedy top-N: highest rating first, ties go to quote strength, then variety, then the longer note. */
function pickTop(beers: Rated[], count: number): Rated[] {
  const remaining = [...beers];
  const picked: Rated[] = [];
  while (picked.length < count && remaining.length > 0) {
    const topRating = Math.max(...remaining.map((b) => b.rating));
    const overlap = (b: Rated) =>
      picked.filter((p) => p.style === b.style).length + picked.filter((p) => p.country === b.country).length;
    const candidates = remaining
      .filter((b) => b.rating === topRating)
      .sort(
        (a, b) =>
          quoteStrength(b.note) - quoteStrength(a.note) ||
          overlap(a) - overlap(b) ||
          b.note.length - a.note.length,
      );
    const choice = candidates[0]!;
    picked.push(choice);
    remaining.splice(remaining.indexOf(choice), 1);
  }
  return picked;
}

function hookFor(month: string, beers: number, countries: number, top: number | null, worst: number | null) {
  const headline = `${beers} new beer${beers === 1 ? "" : "s"} in ${monthName(month)}`;
  let teaser: string;
  if (worst !== null && worst <= 3) {
    teaser = `One of these scored ${worst}/10. Stay for the best.`;
  } else if (top !== null && top >= 9) {
    teaser = `Only one scored ${top}/10. Can you guess which?`;
  } else if (countries > 1) {
    teaser = `${countries} countries. One winner.`;
  } else {
    teaser = "Only one can be the best.";
  }
  return { headline, teaser };
}

export function buildStory(month: string, beers: Beer[]): Story {
  const eligible = beers.filter((b): b is Rated => b.rating !== null && b.note.trim().length > 0);

  const worstBeer =
    eligible.length >= 2
      ? eligible.reduce((low, b) => (b.rating < low.rating ? b : low), eligible[0]!)
      : null;
  const pool = eligible.filter((b) => b !== worstBeer);
  const countdownSize = eligible.length < 3 ? Math.min(1, pool.length) : Math.min(MAX_COUNTDOWN, pool.length);
  const top = pickTop(pool, countdownSize);

  const rated = beers.filter((b) => b.rating !== null);
  const countries = new Set(beers.map((b) => shortCountry(b.country)).filter(Boolean)).size;
  const styles = new Set(beers.map((b) => b.style).filter(Boolean)).size;
  const averageRating = rated.length
    ? Math.round((rated.reduce((sum, b) => sum + b.rating!, 0) / rated.length) * 10) / 10
    : 0;

  return {
    month,
    monthName: monthName(month),
    hook: hookFor(month, beers.length, countries, top[0]?.rating ?? null, worstBeer?.rating ?? null),
    stats: { beers: beers.length, countries, styles, averageRating },
    countdown: top.reverse().map(toHighlight),
    worst: worstBeer ? toHighlight(worstBeer) : null,
    images: beers.map((b) => b.image),
    cta: {
      question: "Which one would you try?",
    },
  };
}
