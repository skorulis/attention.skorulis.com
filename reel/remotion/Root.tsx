import type React from "react";
import { Composition, staticFile } from "remotion";
import type { Story } from "../src/types";
import { Reel } from "./Reel";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { totalDuration } from "./timeline";

const placeholder: Story = {
  month: "2026-01",
  monthName: "January",
  hook: { headline: "0 new beers in January", teaser: "Run `npm run studio -- <month>` to load a month." },
  stats: { beers: 0, countries: 0, styles: 0, averageRating: 0 },
  countdown: [],
  worst: null,
  images: [],
  cta: { question: "Which one would you try?" },
};

function isEmptyStory(story: Story): boolean {
  return story.images.length === 0 && story.countdown.length === 0;
}

async function loadCurrentStory(): Promise<Story | null> {
  try {
    const res = await fetch(staticFile("current/story.json"));
    if (!res.ok) return null;
    return (await res.json()) as Story;
  } catch {
    return null;
  }
}

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={totalDuration(placeholder)}
    defaultProps={placeholder}
    calculateMetadata={async ({ props }) => {
      const story = isEmptyStory(props) ? ((await loadCurrentStory()) ?? props) : props;
      return {
        durationInFrames: totalDuration(story),
        props: story,
      };
    }}
  />
);
