import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

const subsets: ("latin" | "latin-ext" | "vietnamese")[] = ["latin", "latin-ext", "vietnamese"];

export const display = loadAnton("normal", { weights: ["400"], subsets }).fontFamily;
export const body = loadMontserrat("normal", { weights: ["600", "800"], subsets }).fontFamily;

export const colors = {
  bg: "#0d0b08",
  gold: "#ffb400",
  cream: "#fff6e0",
  red: "#ff3b30",
  ink: "#1a1206",
};

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

/** Instagram overlays its own UI on the top and bottom of reels; keep text between these. */
export const SAFE_TOP = 250;
export const SAFE_BOTTOM = HEIGHT - 400;

export const textShadow = "0 4px 24px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)";
