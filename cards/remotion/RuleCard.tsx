import type React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { styleByName } from "../src/styles";
import { body, displayFonts, mono, textShadow } from "./theme";

export type RuleCardProps = {
  bg: string | null;
  number: string;
  title: string;
  summary: string;
  style: string;
};

export const RuleCard: React.FC<RuleCardProps> = ({ bg, number, title, summary, style }) => {
  const cardStyle = styleByName(style);
  const display = displayFonts[cardStyle.font] ?? body;

  return (
    <AbsoluteFill style={{ background: "#0a0c12" }}>
      {bg ? (
        <Img
          src={staticFile(bg)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 20%, rgba(60,80,120,0.5), transparent 70%), linear-gradient(170deg, #141a26 0%, #0a0c12 100%)",
          }}
        />
      )}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, ${cardStyle.scrim} 0%, ${cardStyle.scrim.replace(/[\d.]+\)$/, "0.55)")} 35%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 96,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: mono,
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: cardStyle.accent,
            textShadow,
          }}
        >
          {number}
        </div>
        <div
          style={{
            fontFamily: display,
            fontSize: 88,
            lineHeight: 1.02,
            letterSpacing: "-0.01em",
            color: "#ffffff",
            textShadow,
            textWrap: "balance",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: body,
            fontSize: 40,
            fontWeight: 500,
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.88)",
            textShadow,
          }}
        >
          {summary}
        </div>
      </div>
    </AbsoluteFill>
  );
};
