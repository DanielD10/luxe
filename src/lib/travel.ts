import type { Destination } from "./types";

/**
 * Door-to-door estimates from US home airports.
 *
 * These are estimates, labeled as such on every page: great-circle
 * flight time plus realistic connections, airport time and the last
 * leg (seaplane, drive, train). Good enough to compare places; the
 * advisor quotes real itineraries.
 */

export type Origin = { code: string; city: string; lat: number; lon: number; tz: string; small: boolean };

export const ORIGINS: Origin[] = [
  { code: "SAT", city: "San Antonio", lat: 29.53, lon: -98.47, tz: "America/Chicago", small: true },
  { code: "AUS", city: "Austin", lat: 30.19, lon: -97.67, tz: "America/Chicago", small: true },
  { code: "IAH", city: "Houston", lat: 29.98, lon: -95.34, tz: "America/Chicago", small: false },
  { code: "DFW", city: "Dallas–Fort Worth", lat: 32.9, lon: -97.04, tz: "America/Chicago", small: false },
  { code: "ATL", city: "Atlanta", lat: 33.64, lon: -84.43, tz: "America/New_York", small: false },
  { code: "MIA", city: "Miami", lat: 25.79, lon: -80.29, tz: "America/New_York", small: false },
  { code: "JFK", city: "New York", lat: 40.64, lon: -73.78, tz: "America/New_York", small: false },
  { code: "ORD", city: "Chicago", lat: 41.98, lon: -87.9, tz: "America/Chicago", small: false },
  { code: "DEN", city: "Denver", lat: 39.86, lon: -104.67, tz: "America/Denver", small: false },
  { code: "LAX", city: "Los Angeles", lat: 33.94, lon: -118.41, tz: "America/Los_Angeles", small: false },
  { code: "SFO", city: "San Francisco", lat: 37.62, lon: -122.38, tz: "America/Los_Angeles", small: false },
  { code: "SEA", city: "Seattle", lat: 47.45, lon: -122.31, tz: "America/Los_Angeles", small: false },
];

export const DEFAULT_ORIGIN = "SAT";

export function getOrigin(code: string | null | undefined): Origin {
  return ORIGINS.find((o) => o.code === code) ?? ORIGINS[0];
}

function km(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(bLat - aLat);
  const dLon = r(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const CRUISE_KMH = 820;
const LAYOVER_H = 2.5;
const AIRPORT_H = 2.0; // home to airport, check-in, security
const NONSTOP_MAX_KM = 13_500;

export type DoorToDoor = { hours: number; connections: number; flightKm: number };

export function doorToDoor(d: Destination, originCode: string): DoorToDoor {
  const o = getOrigin(originCode);
  const g = d.gateway;
  const dist = km(o.lat, o.lon, g.lat, g.lon);
  let connections = g.extra ?? 0;
  // Small airports connect through a hub for anything long-haul.
  if (o.small && (dist > 4000 || !g.hub)) connections += 1;
  // Smaller gateways, or very long distances, need one more stop.
  if (!g.hub || dist > NONSTOP_MAX_KM) connections += 1;
  // Domestic hops to small gateways are usually nonstop from big hubs.
  if (!o.small && dist < 2500 && g.hub) connections = g.extra ?? 0;
  // Connections add detour distance, roughly.
  const flight = (dist * (1 + 0.06 * connections)) / CRUISE_KMH + 0.5 * (1 + connections);
  const hours = AIRPORT_H + flight + connections * LAYOVER_H + g.lastLeg;
  return { hours: Math.round(hours), connections, flightKm: Math.round(dist) };
}

/** Hours ahead (+) or behind (−) of the origin, right now, DST included. */
export function hoursAhead(destTz: string, originTz: string, at = new Date()): number {
  const off = (tz: string) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(at);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    return (asUTC - at.getTime()) / 3_600_000;
  };
  return Math.round((off(destTz) - off(originTz)) * 2) / 2;
}

export function formatAhead(h: number): string {
  if (h === 0) return "Same time";
  const n = Math.abs(h);
  const s = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${h > 0 ? "+" : "−"}${s} h`;
}

/**
 * What the LUXE perks are worth, conservatively. Breakfast for two is
 * valued at $60 a day, the minimum a 2026 comparison of Virtuoso and
 * Amex FHR used; the property credit is $100 per stay.
 */
export const PERKS = {
  breakfastPerDay: 60,
  credit: 100,
};

export function perksValue(nights: number): number {
  return PERKS.breakfastPerDay * nights + PERKS.credit;
}
