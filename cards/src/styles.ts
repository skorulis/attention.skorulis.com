export interface CardStyle {
  name: string;
  prompt: string;
  font: string;
  accent: string;
  scrim: string;
}

export const STYLES: CardStyle[] = [
  {
    name: "risograph",
    prompt: "two-colour risograph print, grainy, offset misregistration",
    font: "anton",
    accent: "#ff6b4a",
    scrim: "rgba(20, 12, 30, 0.92)",
  },
  {
    name: "flat-vector",
    prompt: "flat vector illustration, bold shapes, limited palette",
    font: "montserrat",
    accent: "#f4b41a",
    scrim: "rgba(10, 14, 20, 0.9)",
  },
  {
    name: "bold-collage",
    prompt: "cut-paper collage, torn edges, high contrast",
    font: "bebas",
    accent: "#ff3b30",
    scrim: "rgba(15, 10, 8, 0.9)",
  },
  {
    name: "editorial-photo",
    prompt: "cinematic editorial photograph, shallow depth of field, dramatic light",
    font: "playfair",
    accent: "#ffd166",
    scrim: "rgba(8, 8, 10, 0.88)",
  },
  {
    name: "neon-grid",
    prompt: "retro neon on dark grid, glowing lines",
    font: "spacegrotesk",
    accent: "#22d3ee",
    scrim: "rgba(5, 5, 20, 0.9)",
  },
  {
    name: "paper-cut",
    prompt: "layered paper-cut art, soft shadows, pastel",
    font: "playfair",
    accent: "#e05d8f",
    scrim: "rgba(30, 20, 35, 0.9)",
  },
  {
    name: "brutalist",
    prompt: "brutalist graphic design, raw concrete textures, stark black and red",
    font: "anton",
    accent: "#ff2d20",
    scrim: "rgba(0, 0, 0, 0.92)",
  },
  {
    name: "watercolor",
    prompt: "loose watercolor painting, white paper margins, soft bleeding colours",
    font: "playfair",
    accent: "#3b82c4",
    scrim: "rgba(12, 18, 30, 0.85)",
  },
];

export function styleByName(name: string): CardStyle {
  const style = STYLES.find((s) => s.name === name);
  if (!style) {
    throw new Error(`Unknown style "${name}". Options: ${STYLES.map((s) => s.name).join(", ")}`);
  }
  return style;
}
