import type React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Highlight } from "../../src/types";
import { BeerCaption } from "../components/BeerCaption";
import { Flash } from "../components/Flash";
import { PhotoFrame } from "../components/PhotoFrame";
import { RatingStamp } from "../components/RatingStamp";
import { colors, display, textShadow } from "../theme";
import { CAPTION_TOP, CountdownProgress, PHOTO_TOP, PHOTO_WIDTH } from "./CountdownCard";

const DRUMROLL = 36;

const Drumroll: React.FC<{ images: string[] }> = ({ images }) => {
  const frame = useCurrentFrame();
  const image = images[Math.floor(frame / 3) % Math.max(1, images.length)];
  const scale = interpolate(frame, [0, DRUMROLL], [0.6, 1.4]);
  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center" }}>
      {image ? (
        <Img
          src={staticFile(image)}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(50px) brightness(0.5)",
          }}
        />
      ) : null}
      <div
        style={{
          fontFamily: display,
          fontSize: 420,
          color: colors.gold,
          textShadow,
          transform: `scale(${scale})`,
        }}
      >
        #1
      </div>
    </AbsoluteFill>
  );
};

export const Reveal: React.FC<{ beer: Highlight; total: number; teaseImages: string[] }> = ({
  beer,
  total,
  teaseImages,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = spring({ frame: frame - DRUMROLL, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Sequence durationInFrames={DRUMROLL}>
        <Drumroll images={teaseImages} />
      </Sequence>
      <Sequence from={DRUMROLL}>
        <AbsoluteFill>
          <PhotoFrame image={beer.image} width={PHOTO_WIDTH} top={PHOTO_TOP} zoom={[1.12, 1]} />
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 40%, rgba(255,180,0,${0.35 * glow}) 0%, rgba(255,180,0,0) 60%)`,
              mixBlendMode: "screen",
            }}
          />
          {total > 1 ? <CountdownProgress place={1} total={total} /> : null}
          <div
            style={{
              position: "absolute",
              top: PHOTO_TOP - 110,
              left: (1080 - PHOTO_WIDTH) / 2 - 60,
              fontFamily: display,
              fontSize: 240,
              lineHeight: 1,
              color: colors.gold,
              textShadow,
              transform: `rotate(-6deg) scale(${0.5 + 0.5 * glow})`,
            }}
          >
            #1
          </div>
          <RatingStamp
            rating={beer.rating}
            delay={8}
            size={260}
            style={{ top: PHOTO_TOP + 520, left: (1080 + PHOTO_WIDTH) / 2 - 180 }}
          />
          <BeerCaption beer={beer} quote={beer.longQuote} top={CAPTION_TOP} delay={14} />
          <Flash frames={10} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
