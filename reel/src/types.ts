export interface Beer {
  slug: string;
  name: string;
  note: string;
  rating: number | null;
  brewery: string | null;
  country: string | null;
  style: string | null;
  addedOn: string;
  /** Path relative to `reel/public/`, usable with Remotion's `staticFile`. */
  image: string;
}

export interface Highlight {
  slug: string;
  name: string;
  brewery: string | null;
  country: string | null;
  style: string | null;
  rating: number;
  quote: string;
  /** The tasting note, lightly truncated; shown on the #1 reveal. */
  longQuote: string;
  image: string;
}

/** A type alias (not an interface) so it satisfies Remotion's `Record<string, unknown>` props constraint. */
export type Story = {
  month: string;
  monthName: string;
  hook: {
    headline: string;
    teaser: string;
  };
  stats: {
    beers: number;
    countries: number;
    styles: number;
    averageRating: number;
  };
  /** Ordered from lowest to highest place, so the last entry is #1. */
  countdown: Highlight[];
  worst: Highlight | null;
  /** Every photo from the month, for the hook montage and outro grid. */
  images: string[];
  cta: {
    question: string;
  };
}
