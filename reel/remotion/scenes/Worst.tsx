import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Highlight } from "../../src/types";
import { BeerCaption } from "../components/BeerCaption";
import { PhotoFrame } from "../components/PhotoFrame";
import { RatingStamp } from "../components/RatingStamp";
import { body, colors, display, SAFE_TOP, textShadow } from "../theme";
import { CAPTION_TOP, PHOTO_TOP, PHOTO_WIDTH } from "./CountdownCard";

export const Worst: React.FC<{ beer: Highlight }> = ({ beer }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 8, stiffness: 200 } });
  const shake = frame < 20 ? Math.sin(frame * 2.2) * (20 - frame) * 1.2 : 0;
  const teaserStart = durationInFrames - 35;
  const teaserIn = spring({ frame: frame - teaserStart - 6, fps, config: { damping: 14 } });
  const captionOut = interpolate(frame, [teaserStart, teaserStart + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <PhotoFrame
        image={beer.image}
        width={PHOTO_WIDTH}
        top={PHOTO_TOP}
        zoom={[1.15, 1]}
        tint="rgba(120, 0, 0, 0.35)"
      />
      <div
        style={{
          position: "absolute",
          top: SAFE_TOP - 20,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: display,
          fontSize: 130,
          lineHeight: 1,
          color: colors.red,
          textShadow,
          transform: `translateX(${shake}px) scale(${0.6 + 0.4 * titleIn})`,
          opacity: titleIn,
        }}
      >
        BUT THE WORST…
      </div>
      <RatingStamp
        rating={beer.rating}
        delay={12}
        size={210}
        color={colors.red}
        textColor={colors.cream}
        style={{ top: PHOTO_TOP + 560, left: (1080 + PHOTO_WIDTH) / 2 - 150 }}
      />
      <div style={{ opacity: captionOut }}>
        <BeerCaption beer={beer} top={CAPTION_TOP} delay={18} accent={colors.red} />
      </div>
      <div
        style={{
          position: "absolute",
          top: CAPTION_TOP + 40,
          left: 60,
          right: 60,
          textAlign: "center",
          fontFamily: body,
          fontWeight: 800,
          fontSize: 64,
          color: colors.gold,
          textShadow,
          opacity: teaserIn,
          transform: `scale(${0.8 + 0.2 * teaserIn})`,
        }}
      >
        So who took #1?
      </div>
    </AbsoluteFill>
  );
};
