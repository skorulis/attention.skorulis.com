export interface Principle {
  slug: string;
  title: string;
  summary: string;
  why: string;
  tactics: string[];
  imagePrompt: string;
  images: string[];
}

export interface PrinciplesData {
  principles: Principle[];
}
