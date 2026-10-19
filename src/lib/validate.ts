import type { Destination } from "./types";
import { countries } from "./countries";

/**
 * Runs when the destination list loads. A bad entry (typo'd month
 * string, unknown country, invalid time zone, duplicate slug) fails
 * the build instead of shipping a broken page.
 */
export function validateDestinations(list: Destination[]): void {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const d of list) {
    const at = `[${d.slug}]`;
    if (seen.has(d.slug)) errors.push(`${at} duplicate slug`);
    seen.add(d.slug);
    if (!/^[a-z0-9-]+$/.test(d.slug)) errors.push(`${at} slug must be lowercase-with-dashes`);
    if (!/^[012x]{12}$/.test(d.months)) errors.push(`${at} months must be 12 of 0/1/2/x`);
    if (!d.months.includes("2")) errors.push(`${at} needs at least one best month`);
    for (const k of Object.keys(d.monthNotes)) {
      const n = Number(k);
      if (!(n >= 0 && n <= 11)) errors.push(`${at} month note index ${k}`);
    }
    if (!countries[d.countryKey]) errors.push(`${at} unknown countryKey ${d.countryKey}`);
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: d.timezone });
    } catch {
      errors.push(`${at} invalid time zone ${d.timezone}`);
    }
    if (!d.photos.length) errors.push(`${at} needs at least one photo`);
    for (const ph of d.photos) if (!/^photo-[0-9]+-[0-9a-f]+$/.test(ph.id)) errors.push(`${at} bad photo id ${ph.id}`);
    if (d.stays.length < 1) errors.push(`${at} needs at least one stay`);
    if (d.highlights.length < 3) errors.push(`${at} needs three highlights`);
    if (d.summary.length > 320) errors.push(`${at} summary too long (${d.summary.length})`);
  }
  if (errors.length) throw new Error("Destination data problems:\n" + errors.join("\n"));
}
