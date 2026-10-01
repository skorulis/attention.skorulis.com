import type React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

/** A sharp photo over a blurred, zoomed copy of itself, with a slow push-in. */
export const PhotoFrame: React.FC<{
  image: string;
  width?: number;
  top?: number;
  zoom?: [number, number];
  tint?: string;
  children?: React.ReactNode;
}> = ({ image, width = 760, top = 330, zoom = [1, 1.08], tint, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const src = staticFile(image);
  const scale = interpolate(frame, [0, durationInFrames], zoom, { extrapolateRight: "clamp" });
  const height = Math.round((width * 4) / 3);

  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          position: "absolute",
          inset: -80,
          width: "calc(100% + 160px)",
          height: "calc(100% + 160px)",
          objectFit: "cover",
          filter: "blur(40px) brightness(0.45) saturate(1.3)",
          transform: `scale(${scale * 1.1})`,
        }}
      />
      {tint ? <AbsoluteFill style={{ background: tint }} /> : null}
      <div
        style={{
          position: "absolute",
          left: (1080 - width) / 2,
          top,
          width,
          height,
          borderRadius: 36,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        <Img
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }}
        />
        {children}
      </div>
    </AbsoluteFill>
  );
};
