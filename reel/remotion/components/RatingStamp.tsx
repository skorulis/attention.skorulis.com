import type React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, display } from "../theme";

/** A rating badge that slams in from oversized. */
export const RatingStamp: React.FC<{
  rating: number;
  delay?: number;
  size?: number;
  color?: string;
  textColor?: string;
  style?: React.CSSProperties;
}> = ({ rating, delay = 0, size = 240, color = colors.gold, textColor = colors.ink, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 180 } });
  const scale = 3 - 2 * progress;
  const rotate = -18 + 10 * progress;

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: textColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: display,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        opacity: frame < delay ? 0 : Math.min(1, progress * 2),
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        border: `8px solid ${colors.cream}`,
        ...style,
      }}
    >
      <div style={{ fontSize: size * 0.42, lineHeight: 1 }}>{rating}</div>
      <div style={{ fontSize: size * 0.16, lineHeight: 1, opacity: 0.8 }}>/10</div>
    </div>
  );
};
