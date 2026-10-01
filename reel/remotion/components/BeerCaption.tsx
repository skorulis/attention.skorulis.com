import type React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Highlight } from "../../src/types";
import { body, colors, textShadow } from "../theme";

/** Name, brewery and quote stacked under the photo, sliding up in sequence. */
export const BeerCaption: React.FC<{
  beer: Highlight;
  quote?: string;
  top?: number;
  delay?: number;
  accent?: string;
}> = ({ beer, quote = beer.quote, top = 1350, delay = 8, accent = colors.gold }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = (d: number) => spring({ frame: frame - delay - d, fps, config: { damping: 15 } });
  const meta = [beer.brewery, beer.country].filter(Boolean).join(" · ");

  const line = (d: number): React.CSSProperties => ({
    opacity: enter(d),
    transform: `translateY(${(1 - enter(d)) * 40}px)`,
  });

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        textAlign: "center",
        color: colors.cream,
        textShadow,
        fontFamily: body,
      }}
    >
      <div style={{ ...line(0), fontWeight: 800, fontSize: beer.name.length > 26 ? 50 : 60, lineHeight: 1.1 }}>
        {beer.name}
      </div>
      {meta ? (
        <div style={{ ...line(4), fontWeight: 600, fontSize: 34, color: accent, marginTop: 8 }}>{meta}</div>
      ) : null}
      {quote ? (
        <div
          style={{
            ...line(14),
            fontWeight: 600,
            fontSize: quote.length > 110 ? 34 : 40,
            fontStyle: "italic",
            lineHeight: 1.25,
            marginTop: 18,
          }}
        >
          “{quote}”
        </div>
      ) : null}
    </div>
  );
};
