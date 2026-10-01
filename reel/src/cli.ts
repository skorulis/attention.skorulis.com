import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { revealFrame } from "../remotion/timeline.js";
import { fetchMonth } from "./fetch.js";
import { currentStoryPublicPath, outDir, beersPath, publicDir, reelRoot, storyPath } from "./paths.js";
import { buildStory } from "./pick.js";
import type { Beer, Story } from "./types.js";

type Command = "fetch" | "pick" | "render" | "all" | "studio";
const COMMANDS: Command[] = ["fetch", "pick", "render", "all", "studio"];

function previousMonth(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

function latestStoryMonth(): string | null {
  const dir = join(reelRoot, "months");
  if (!existsSync(dir)) return null;
  const months = readdirSync(dir)
    .filter((m) => existsSync(storyPath(m)))
    .sort();
  return months.at(-1) ?? null;
}

function parseArgs(argv: string[]) {
  const [command, ...rest] = argv;
  if (!COMMANDS.includes(command as Command)) {
    throw new Error(`Usage: cli.ts <${COMMANDS.join("|")}> [YYYY-MM] [--fresh]`);
  }
  const fresh = rest.includes("--fresh");
  const reusesStory = command === "render" || command === "studio";
  const month =
    rest.find((a) => !a.startsWith("--")) ?? (reusesStory ? latestStoryMonth() : null) ?? previousMonth();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error(`Month must be YYYY-MM, got "${month}"`);
  return { command: command as Command, month, fresh };
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function stepFetch(month: string, fresh: boolean): Promise<Beer[]> {
  if (!fresh && existsSync(beersPath(month))) {
    const beers = await readJson<Beer[]>(beersPath(month));
    console.log(`Using cached ${beers.length} beers for ${month} (pass --fresh to re-scrape)`);
    return beers;
  }
  console.log(`Scraping bigalbumofbeers.com for ${month}…`);
  const beers = await fetchMonth(month);
  console.log(`Found ${beers.length} beers`);
  if (beers.length === 0) throw new Error(`No beers were added in ${month}`);
  return beers;
}

async function stepPick(month: string, fresh: boolean): Promise<Story> {
  if (!fresh && existsSync(storyPath(month))) {
    console.log(`Keeping existing ${storyPath(month)} (pass --fresh to regenerate)`);
    await publishCurrentStory(month);
    return readJson<Story>(storyPath(month));
  }
  const story = buildStory(month, await readJson<Beer[]>(beersPath(month)));
  await writeFile(storyPath(month), JSON.stringify(story, null, 2) + "\n");
  await publishCurrentStory(month);
  console.log(`Wrote ${storyPath(month)}`);
  console.log(`  Hook: ${story.hook.headline}. ${story.hook.teaser}`);
  story.countdown.forEach((b, i) => console.log(`  #${story.countdown.length - i}: ${b.name} (${b.rating}/10)`));
  if (story.worst) console.log(`  Worst: ${story.worst.name} (${story.worst.rating}/10)`);
  return story;
}

function hashtag(text: string): string {
  return `#${text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;
}

function caption(story: Story, beers: Beer[]): string {
  const top = story.countdown.at(-1);
  const countries = [...new Set(beers.map((b) => b.country?.split(" / ")[0]).filter(Boolean))] as string[];
  const tags = ["#beer", "#craftbeer", "#beerreview", "#beerstagram", "#untappd", ...countries.slice(0, 4).map((c) => hashtag(`${c}beer`))];
  return [
    `${story.hook.headline}, ranked 🍺`,
    "",
    top ? `🥇 ${top.name} (${top.rating}/10)` : null,
    story.worst ? `💀 ${story.worst.name} (${story.worst.rating}/10)` : null,
    "",
    story.cta.question,
    "",
    tags.join(" "),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

async function stepRender(month: string, story: Story) {
  await publishCurrentStory(month);
  const out = outDir(month);
  await mkdir(out, { recursive: true });

  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({ entryPoint: join(reelRoot, "remotion/index.ts"), publicDir });
  const composition = await selectComposition({ serveUrl, id: "Reel", inputProps: story });

  const videoPath = join(out, "reel.mp4");
  let lastPercent = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps: story,
    codec: "h264",
    crf: 18,
    outputLocation: videoPath,
    onProgress: ({ progress }) => {
      const percent = Math.floor(progress * 10) * 10;
      if (percent !== lastPercent) {
        lastPercent = percent;
        console.log(`  rendering ${percent}%`);
      }
    },
  });
  console.log(`Wrote ${videoPath}`);

  const coverPath = join(out, "cover.png");
  await renderStill({
    serveUrl,
    composition,
    inputProps: story,
    frame: revealFrame(story) ?? 30,
    output: coverPath,
  });
  console.log(`Wrote ${coverPath}`);

  const captionPath = join(out, "caption.txt");
  await writeFile(captionPath, caption(story, await readJson<Beer[]>(beersPath(month))) + "\n");
  console.log(`Wrote ${captionPath}`);
}

async function publishCurrentStory(month: string) {
  await mkdir(join(publicDir, "current"), { recursive: true });
  await copyFile(storyPath(month), currentStoryPublicPath);
}

async function studio(month: string): Promise<void> {
  await publishCurrentStory(month);
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["remotion", "studio", "remotion/index.ts", `--props=${storyPath(month)}`], {
      cwd: reelRoot,
      stdio: "inherit",
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`studio exited with ${code}`))));
  });
}

async function main() {
  const { command, month, fresh } = parseArgs(process.argv.slice(2));
  if ((command === "render" || command === "studio") && !existsSync(storyPath(month))) {
    throw new Error(`No story for ${month}. Run \`npm run reel -- ${month}\` first.`);
  }
  if (command === "render" || command === "studio") console.log(`Using ${month}`);

  if (command === "fetch") await stepFetch(month, true);
  if (command === "all") await stepFetch(month, fresh);
  if (command === "pick") {
    await stepPick(month, fresh);
  } else if (command === "all") {
    const story = await stepPick(month, fresh);
    await stepRender(month, story);
  } else if (command === "render") {
    await stepRender(month, await readJson<Story>(storyPath(month)));
  } else if (command === "studio") {
    await studio(month);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
