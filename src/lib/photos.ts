import type { Photo } from "./types";

/**
 * Unsplash serves resized images from its own CDN (imgix), so the site
 * never needs to proxy or re-host them. Hotlinking is how Unsplash asks
 * to be used, and every photo is credited with a link back.
 */

const BASE = "https://images.unsplash.com/";
const UTM = "utm_source=luxe&utm_medium=referral";

export function photoUrl(ph: Photo, w: number, opts: { h?: number; q?: number } = {}): string {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    w: String(w),
    q: String(opts.q ?? 72),
  });
  if (opts.h) params.set("h", String(opts.h));
  return `${BASE}${ph.id}?${params.toString()}`;
}

export function photoSrcSet(ph: Photo, widths: number[], ratio?: number): string {
  return widths
    .map((w) => `${photoUrl(ph, w, ratio ? { h: Math.round(w / ratio) } : {})} ${w}w`)
    .join(", ");
}

export function photoPage(ph: Photo): string {
  return `https://unsplash.com/photos/${ph.page}?${UTM}`;
}

export const UNSPLASH_HOME = `https://unsplash.com/?${UTM}`;
