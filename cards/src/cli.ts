import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { loadEnv } from "./env.js";
import { buildPrompt, generateBackground } from "./openai.js";
import { bgPath, cardPath, cardsRoot, outDir, publicBgPath, publicDir, publishDir } from "./paths.js";
import { loadPrinciples, savePrinciples } from "./principles.js";
import { STYLES, styleByName, type CardStyle } from "./styles.js";
import type { Principle } from "./types.js";

type Command = "generate" | "render" | "publish" | "studio";
const COMMANDS: Command[] = ["generate", "render", "publish", "studio"];

interface Args {
  command: Command;
  slug: string | null;
  styleName: string | null;
  allStyles: boolean;
  fresh: boolean;
  dry: boolean;
  positional: string[];
}

function parseArgs(argv: string[]): Args {
  const [command, ...rest] = argv;
  if (!COMMANDS.includes(command as Command)) {
    throw new Error(
      `Usage: cli.ts <${COMMANDS.join("|")}> [slug] [style] [--style <name>|--all-styles] [--fresh] [--dry]`,
    );
  }
  const positional: string[] = [];
  let styleName: string | null = null;
  let allStyles = false;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!;
    if (arg === "--style") {
      styleName = rest[++i] ?? null;
      if (!styleName) throw new Error("--style requires a name");
    } else if (arg === "--all-styles") {
      allStyles = true;
    } else if (arg.startsWith("--")) {
      // handled below
    } else {
      positional.push(arg);
    }
  }
  if (styleName && allStyles) throw new Error("Pass --style or --all-styles, not both");
  return {
    command: command as Command,
    slug: positional[0] ?? null,
    styleName,
    allStyles,
    fresh: rest.includes("--fresh"),
    dry: rest.includes("--dry"),
    positional,
  };
}

function selectPrinciples(principles: Principle[], slug: string | null): { p: Principle; index: number }[] {
  if (!slug) return principles.map((p, index) => ({ p, index }));
  const index = principles.findIndex((p) => p.slug === slug);
  if (index === -1) {
    throw new Error(`Unknown principle "${slug}". Options: ${principles.map((p) => p.slug).join(", ")}`);
  }
  return [{ p: principles[index]!, index }];
}

function selectStyles(args: Args, index: number): CardStyle[] {
  if (args.allStyles) return STYLES;
  if (args.styleName) return [styleByName(args.styleName)];
  return [STYLES[index % STYLES.length]!];
}

async function renderCards(args: Args, useOpenAI: boolean): Promise<void> {
  const principles = await loadPrinciples();

  type Job = { p: Principle; style: CardStyle; props: { bg: string | null; number: string; title: string; summary: string; style: string }; out: string };
  const jobs: Job[] = [];

  for (const { p, index } of selectPrinciples(principles, args.slug)) {
    for (const style of selectStyles(args, index)) {
      const dir = outDir(p.slug);
      await mkdir(dir, { recursive: true });

      let bg: string | null = null;
      if (!args.dry) {
        const bgFile = bgPath(p.slug, style.name);
        if (existsSync(bgFile) && !args.fresh) {
          console.log(`Reusing ${bgFile}`);
        } else if (useOpenAI) {
          console.log(`Generating background for ${p.slug}/${style.name}…`);
          await generateBackground(buildPrompt(p.imagePrompt, style), bgFile);
          console.log(`Wrote ${bgFile}`);
        } else {
          throw new Error(`Missing background ${bgFile}. Run \`npm run cards -- generate ${p.slug} --style ${style.name}\` first.`);
        }
        const dest = publicBgPath(p.slug, style.name);
        await mkdir(join(publicDir, "bg"), { recursive: true });
        await copyFile(bgFile, dest);
        bg = `bg/${p.slug}-${style.name}.png`;
      }

      jobs.push({
        p,
        style,
        props: {
          bg,
          number: String(index + 1).padStart(2, "0"),
          title: p.title,
          summary: p.summary,
          style: style.name,
        },
        out: cardPath(p.slug, style.name),
      });
    }
  }

  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({ entryPoint: join(cardsRoot, "remotion/index.ts"), publicDir });

  for (const job of jobs) {
    const composition = await selectComposition({ serveUrl, id: "RuleCard", inputProps: job.props });
    await renderStill({ serveUrl, composition, inputProps: job.props, output: job.out });
    console.log(`Wrote ${job.out}`);
  }
}

async function publish(args: Args): Promise<void> {
  const slug = args.positional[0];
  const styleName = args.positional[1];
  if (!slug || !styleName) {
    throw new Error("Usage: cli.ts publish <slug> <style>");
  }
  const src = cardPath(slug, styleName);
  if (!existsSync(src)) {
    throw new Error(`No rendered card at ${src}. Run \`npm run cards -- render ${slug} --style ${styleName}\` first.`);
  }

  const dir = publishDir(slug);
  await mkdir(dir, { recursive: true });
  const dest = join(dir, `${styleName}.png`);
  await copyFile(src, dest);
  console.log(`Wrote ${dest}`);

  const principles = await loadPrinciples();
  const p = principles.find((x) => x.slug === slug);
  if (!p) throw new Error(`Unknown principle "${slug}"`);
  const url = `/principles/${slug}/${styleName}.png`;
  if (!p.images.includes(url)) {
    p.images.push(url);
    await savePrinciples(principles);
    console.log(`Added ${url} to principles.json`);
  } else {
    console.log(`${url} already in principles.json`);
  }
}

async function studio(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["remotion", "studio", "remotion/index.ts"], {
      cwd: cardsRoot,
      stdio: "inherit",
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`studio exited with ${code}`))));
  });
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "generate") await renderCards(args, true);
  else if (args.command === "render") await renderCards(args, false);
  else if (args.command === "publish") await publish(args);
  else await studio();
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
