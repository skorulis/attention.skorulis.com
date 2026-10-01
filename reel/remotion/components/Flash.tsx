import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

/** A short white flash to punctuate a cut. */
export const Flash: React.FC<{ frames?: number }> = ({ frames = 6 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, frames], [0.85, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "white", opacity, pointerEvents: "none" }} />;
};
