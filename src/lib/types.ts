export type Region = "Europe" | "Asia" | "Africa & Middle East" | "Americas" | "Oceania";

export type Feeling =
  | "Beach"
  | "Island"
  | "Mountains"
  | "Desert"
  | "Safari"
  | "Culture"
  | "City"
  | "Food & Wine"
  | "Snow"
  | "Remote";

/** A photo hosted by Unsplash. Free under the Unsplash License; credited anyway. */
export type Photo = {
  /** The part after images.unsplash.com/, e.g. "photo-1561956021-947f09ae0101" */
  id: string;
  /** Unsplash photo page slug, for the credit link */
  page: string;
  by: string;
  alt: string;
  /**
   * true when the photo's Unsplash page names the place (location, title
   * or tags). false when it doesn't, but the image shows a landmark that
   * can't be mistaken. Every photo was checked by eye; do the same for new ones.
   */
  named: boolean;
};

export type Stay = {
  name: string;
  area: string;
  note: string;
};

/** Gateway airport: where the long-haul flight lands. */
export type Gateway = {
  code: string;
  lat: number;
  lon: number;
  /** Major hub with nonstop service from big US hubs */
  hub: boolean;
  /** Extra connections beyond the long-haul (e.g. Lofoten: Oslo, then Bodø) */
  extra?: number;
  /** Hours from the gateway to the hotel: regional flight, seaplane, drive or train */
  lastLeg: number;
  /** How that last leg works, in a few words */
  lastLegNote: string;
};

export type Destination = {
  slug: string;
  name: string;
  /** Country or territory, as a traveler would say it */
  country: string;
  countryKey: string;
  region: Region;
  tagline: string;
  summary: string;
  feelings: Feeling[];
  /** 12 characters, Jan..Dec: 2 best, 1 good, 0 off-season, x closed */
  months: string;
  monthNotes: Partial<Record<number, string>>;
  highlights: string[];
  stays: Stay[];
  gateway: Gateway;
  timezone: string;
  /** Typical luxury nightly band: 1 under $600, 2 $600–1,200, 3 $1,200–2,500, 4 $2,500+ */
  band: 1 | 2 | 3 | 4;
  nights: number;
  photos: Photo[];
  /** Optional search term for tours, defaults to name */
  toursQuery?: string;
};

export type Country = {
  currency: string;
  plugs: string;
  language: string;
  /** Short, conservative entry note for US passport holders. Always paired with the State Department link. */
  entry: string;
};
