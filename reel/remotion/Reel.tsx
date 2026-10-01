import type React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { Story } from "../src/types";
import { Flash } from "./components/Flash";
import { CountdownCard } from "./scenes/CountdownCard";
import { Hook } from "./scenes/Hook";
import { Outro } from "./scenes/Outro";
import { Reveal } from "./scenes/Reveal";
import { Stats } from "./scenes/Stats";
import { Worst } from "./scenes/Worst";
import { colors } from "./theme";
import { buildTimeline, type Scene } from "./timeline";

function renderScene(scene: Scene, story: Story): React.ReactNode {
  const total = story.countdown.length;
  switch (scene.kind) {
    case "hook":
      return <Hook story={story} />;
    case "stats":
      return <Stats story={story} />;
    case "card": {
      const beer = story.countdown[scene.index!]!;
      return <CountdownCard beer={beer} place={total - scene.index!} total={total} />;
    }
    case "worst":
      return <Worst beer={story.worst!} />;
    case "reveal": {
      const beer = story.countdown[scene.index!]!;
      const teaseImages = story.countdown.map((b) => b.image).filter((image) => image !== beer.image);
      return <Reveal beer={beer} total={total} teaseImages={teaseImages.length ? teaseImages : story.images} />;
    }
    case "outro":
      return <Outro story={story} />;
  }
}

export const Reel: React.FC<Story> = (story) => (
  <AbsoluteFill style={{ background: colors.bg }}>
    {buildTimeline(story).map((scene, i) => (
      <Sequence key={`${scene.kind}-${i}`} from={scene.from} durationInFrames={scene.duration}>
        {renderScene(scene, story)}
        {i > 0 && scene.kind !== "reveal" ? <Flash /> : null}
      </Sequence>
    ))}
  </AbsoluteFill>
);
