import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Story } from "../../src/types";
import { PhotoFrame } from "../components/PhotoFrame";
import { body, colors, display, SAFE_TOP, textShadow } from "../theme";

const MONTAGE_END = 60;

export const Hook: React.FC<{ story: Story }> = ({ story }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { images } = story;

  const framesPerImage = Math.max(2, Math.min(4, Math.floor(MONTAGE_END / Math.max(1, images.length))));
  const montageIndex = Math.min(images.length - 1, Math.floor(frame / framesPerImage));
  const image = images[Math.max(0, montageIndex)] ?? images[0];

  const count = Math.round(
    interpolate(frame, [0, MONTAGE_END], [1, story.stats.beers], { extrapolateRight: "clamp" }),
  );
  const teaserIn = spring({ frame: frame - 30, fps, config: { damping: 14 } });
  const bump = 1 + 0.06 * Math.sin((frame / framesPerImage) * Math.PI);

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      {image ? <PhotoFrame key={image} image={image} width={700} top={560} zoom={[1.02, 1.02]} /> : null}
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 45%)" }}
      />
      <div
        style={{
          position: "absolute",
          top: SAFE_TOP,
          left: 60,
          right: 60,
          textAlign: "center",
          color: colors.cream,
          textShadow,
        }}
      >
        <div
          style={{
            fontFamily: display,
            fontSize: 220,
            lineHeight: 0.9,
            color: colors.gold,
            transform: `scale(${frame < MONTAGE_END ? bump : 1})`,
          }}
        >
          {count}
        </div>
        <div style={{ fontFamily: display, fontSize: 84, lineHeight: 1, textTransform: "uppercase" }}>
          {story.hook.headline.replace(/^\d+\s+/, "")}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 1330,
          padding: "28px 36px",
          borderRadius: 28,
          background: colors.gold,
          color: colors.ink,
          fontFamily: body,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.15,
          textAlign: "center",
          transform: `translateY(${(1 - teaserIn) * 80}px) scale(${0.9 + 0.1 * teaserIn})`,
          opacity: teaserIn,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {story.hook.teaser}
      </div>
    </AbsoluteFill>
  );
};
