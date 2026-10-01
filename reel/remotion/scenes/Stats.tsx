import type React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Story } from "../../src/types";
import { body, colors, display, textShadow } from "../theme";

export const Stats: React.FC<{ story: Story }> = ({ story }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const background = story.images[Math.floor(frame / 12) % Math.max(1, story.images.length)];

  const items = [
    { value: story.stats.countries, label: story.stats.countries === 1 ? "country" : "countries", decimals: 0 },
    { value: story.stats.styles, label: story.stats.styles === 1 ? "style" : "styles", decimals: 0 },
    { value: story.stats.averageRating, label: "average score", decimals: 1 },
  ];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      {background ? (
        <Img
          src={staticFile(background)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(30px) brightness(0.35)",
            transform: "scale(1.2)",
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", gap: 70, paddingBottom: 150 }}
      >
        {items.map((item, i) => {
          const delay = i * 12;
          const progress = spring({ frame: frame - delay, fps, config: { damping: 13 } });
          const counted = interpolate(frame - delay, [0, 24], [0, item.value], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={item.label}
              style={{
                textAlign: "center",
                color: colors.cream,
                textShadow,
                opacity: progress,
                transform: `translateX(${(1 - progress) * (i % 2 === 0 ? -300 : 300)}px)`,
              }}
            >
              <div style={{ fontFamily: display, fontSize: 210, lineHeight: 0.95, color: colors.gold }}>
                {counted.toFixed(item.decimals)}
              </div>
              <div style={{ fontFamily: body, fontWeight: 800, fontSize: 54, textTransform: "uppercase", letterSpacing: 4 }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
