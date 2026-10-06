import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadPlayfairDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";

const subsets: ("latin" | "latin-ext")[] = ["latin", "latin-ext"];

const anton = loadAnton("normal", { weights: ["400"], subsets }).fontFamily;
const bebasNeue = loadBebasNeue("normal", { weights: ["400"], subsets }).fontFamily;
const playfairDisplay = loadPlayfairDisplay("normal", { weights: ["700"], subsets }).fontFamily;
const spaceGrotesk = loadSpaceGrotesk("normal", { weights: ["500", "700"], subsets }).fontFamily;
export const body = loadMontserrat("normal", { weights: ["500", "700"], subsets }).fontFamily;

export const displayFonts: Record<string, string> = {
  anton,
  bebas: bebasNeue,
  playfair: playfairDisplay,
  spacegrotesk: spaceGrotesk,
  montserrat: body,
};

export const mono = '"IBM Plex Mono", "SF Mono", Menlo, monospace';

export const WIDTH = 1080;
export const HEIGHT = 1350;

export const textShadow = "0 4px 24px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.9)";
