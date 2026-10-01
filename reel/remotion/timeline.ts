import type { Story } from "../src/types";

export const DURATIONS = {
  hook: 90,
  stats: 75,
  card: 90,
  worst: 120,
  reveal: 150,
  outro: 120,
};

export type SceneKind = "hook" | "stats" | "card" | "worst" | "reveal" | "outro";

export interface Scene {
  kind: SceneKind;
  from: number;
  duration: number;
  /** Index into `story.countdown` for card and reveal scenes. */
  index?: number;
}

export function buildTimeline(story: Story): Scene[] {
  const scenes: Scene[] = [];
  let from = 0;
  const add = (kind: SceneKind, duration: number, index?: number) => {
    scenes.push({ kind, from, duration, index });
    from += duration;
  };

  add("hook", DURATIONS.hook);
  add("stats", DURATIONS.stats);
  const last = story.countdown.length - 1;
  for (let i = 0; i < last; i++) add("card", DURATIONS.card, i);
  if (story.worst) add("worst", DURATIONS.worst);
  if (last >= 0) add("reveal", DURATIONS.reveal, last);
  add("outro", DURATIONS.outro);
  return scenes;
}

export function totalDuration(story: Story): number {
  return buildTimeline(story).reduce((sum, s) => sum + s.duration, 0);
}

export function revealFrame(story: Story): number | null {
  const reveal = buildTimeline(story).find((s) => s.kind === "reveal");
  return reveal ? reveal.from + 70 : null;
}
