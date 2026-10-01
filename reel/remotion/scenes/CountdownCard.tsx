import type React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Highlight } from "../../src/types";
import { BeerCaption } from "../components/BeerCaption";
import { PhotoFrame } from "../components/PhotoFrame";
import { RatingStamp } from "../components/RatingStamp";
import { colors, display, SAFE_TOP, textShadow } from "../theme";

export const PHOTO_WIDTH = 660;
export const PHOTO_TOP = 360;
export const CAPTION_TOP = 1250;

/** Segmented bar showing how many places remain before #1. */
export const CountdownProgress: React.FC<{ place: number; total: number }> = ({ place, total }) => (
  <div style={{ position: "absolute", top: SAFE_TOP, left: 120, right: 120, display: "flex", gap: 14 }}>
    {Array.from({ length: total }, (_, i) => {
      const segmentPlace = total - i;
      const active = segmentPlace >= place;
      return (
        <div
          key={segmentPlace}
          style={{
            flex: 1,
            height: 14,
            borderRadius: 7,
            background: active ? colors.gold : "rgba(255,255,255,0.25)",
            boxShadow: segmentPlace === place ? `0 0 20px ${colors.gold}` : undefined,
          }}
        />
      );
    })}
  </div>
);

export const CountdownCard: React.FC<{ beer: Highlight; place: number; total: number }> = ({
  beer,
  place,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rankIn = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <PhotoFrame image={beer.image} width={PHOTO_WIDTH} top={PHOTO_TOP} />
      <CountdownProgress place={place} total={total} />
      <div
        style={{
          position: "absolute",
          top: PHOTO_TOP - 90,
          left: (1080 - PHOTO_WIDTH) / 2 - 50,
          fontFamily: display,
          fontSize: 200,
          lineHeight: 1,
          color: colors.cream,
          textShadow,
          transform: `translateX(${(1 - rankIn) * -400}px) rotate(-6deg)`,
        }}
      >
        #{place}
      </div>
      <RatingStamp
        rating={beer.rating}
        delay={10}
        size={210}
        style={{ top: PHOTO_TOP + 560, left: (1080 + PHOTO_WIDTH) / 2 - 150 }}
      />
      <BeerCaption beer={beer} top={CAPTION_TOP} delay={16} />
    </AbsoluteFill>
  );
};
