import type { Destination, Feeling, Region } from "../types";
import { europe } from "./europe";
import { asia } from "./asia";
import { africaMe } from "./africa-me";
import { americas } from "./americas";
import { oceania } from "./oceania";
import { validateDestinations } from "../validate";

export const destinations: Destination[] = [...europe, ...asia, ...africaMe, ...americas, ...oceania];

validateDestinations(destinations);

const bySlug = new Map(destinations.map((d) => [d.slug, d]));

export function getDestination(slug: string): Destination | undefined {
  return bySlug.get(slug);
}

export const REGIONS: Region[] = ["Europe", "Asia", "Africa & Middle East", "Americas", "Oceania"];

export const FEELINGS: Feeling[] = [
  "Beach",
  "Island",
  "Mountains",
  "Desert",
  "Safari",
  "Culture",
  "City",
  "Food & Wine",
  "Snow",
  "Remote",
];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type Season = "best" | "good" | "off" | "closed";

export function seasonOf(d: Pick<Destination, "months">, month: number): Season {
  const c = d.months[month];
  return c === "2" ? "best" : c === "1" ? "good" : c === "x" ? "closed" : "off";
}

export function bestMonths(d: Pick<Destination, "months">): number[] {
  return [...d.months].flatMap((c, i) => (c === "2" ? [i] : []));
}

/** Compact month ranges: [2,3,4,9,10] -> "Mar–May, Oct–Nov" */
export function monthRanges(ms: number[]): string {
  if (!ms.length) return "Year-round";
  const out: string[] = [];
  let start = ms[0];
  let prev = ms[0];
  for (let i = 1; i <= ms.length; i++) {
    const m = ms[i];
    if (m === prev + 1) {
      prev = m;
      continue;
    }
    out.push(start === prev ? MONTHS[start] : `${MONTHS[start]}–${MONTHS[prev]}`);
    start = m;
    prev = m;
  }
  // Join Dec–Feb style wraparound: "Jan–Feb, Dec" -> "Dec–Feb"
  if (out.length > 1 && ms[0] === 0 && ms[ms.length - 1] === 11) {
    const first = out.shift()!;
    const last = out.pop()!;
    const lastStart = last.split("–")[0];
    const firstEnd = first.includes("–") ? first.split("–")[1] : first;
    out.push(`${lastStart}–${firstEnd}`);
  }
  return out.join(", ");
}

export const BAND_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: "Under $600",
  2: "$600–1,200",
  3: "$1,200–2,500",
  4: "$2,500+",
};
