import type { Destination } from "./types";
import { destinations } from "./destinations";

/** What the browser and AI result cards need, so client bundles don't carry every hotel note. */
export type CardData = Pick<
  Destination,
  "slug" | "name" | "country" | "region" | "tagline" | "feelings" | "months" | "band" | "nights" | "gateway" | "timezone"
> & { photo: Destination["photos"][number] };

export function toCard(d: Destination): CardData {
  return {
    slug: d.slug,
    name: d.name,
    country: d.country,
    region: d.region,
    tagline: d.tagline,
    feelings: d.feelings,
    months: d.months,
    band: d.band,
    nights: d.nights,
    gateway: d.gateway,
    timezone: d.timezone,
    photo: d.photos[0],
  };
}

export const cards: CardData[] = destinations.map(toCard);
