import type React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Story } from "../../src/types";
import { body, colors, display, textShadow } from "../theme";

const COLUMNS = 5;

export const Outro: React.FC<{ story: Story }> = ({ story }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const tileWidth = width / COLUMNS;
  const tileHeight = (tileWidth * 4) / 3;
  const rows = Math.ceil(height / tileHeight);
  const tiles = Array.from({ length: COLUMNS * rows }, (_, i) => story.images[i % Math.max(1, story.images.length)]);

  const cardIn = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const gridZoom = interpolate(frame, [0, 120], [1.15, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <AbsoluteFill style={{ transform: `scale(${gridZoom})` }}>
        {tiles.map((image, i) => {
          const pop = spring({ frame: frame - (i % 11), fps, config: { damping: 15 } });
          return image ? (
            <Img
              key={i}
              src={staticFile(image)}
              style={{
                position: "absolute",
                left: (i % COLUMNS) * tileWidth,
                top: Math.floor(i / COLUMNS) * tileHeight,
                width: tileWidth,
                height: tileHeight,
                objectFit: "cover",
                filter: "brightness(0.55)",
                transform: `scale(${pop})`,
              }}
            />
          ) : null;
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 120 }}>
        <div
          style={{
            margin: "0 70px",
            padding: "50px 40px",
            borderRadius: 36,
            background: "rgba(13, 11, 8, 0.88)",
            border: `4px solid ${colors.gold}`,
            textAlign: "center",
            color: colors.cream,
            textShadow,
            transform: `scale(${0.7 + 0.3 * cardIn})`,
            opacity: cardIn,
          }}
        >
          <div style={{ fontFamily: display, fontSize: 110, lineHeight: 1, color: colors.gold }}>
            {story.stats.beers} BEERS
          </div>
          <div style={{ fontFamily: body, fontWeight: 800, fontSize: 56, marginTop: 16 }}>
            in {story.monthName}
          </div>
          <div
            style={{
              fontFamily: body,
              fontWeight: 800,
              fontSize: 48,
              marginTop: 40,
              padding: "18px 24px",
              borderRadius: 20,
              background: colors.gold,
              color: colors.ink,
              textShadow: "none",
            }}
          >
            {story.cta.question}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
