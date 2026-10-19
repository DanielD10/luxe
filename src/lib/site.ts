/**
 * Business details that change per deployment live in env vars, so the
 * code never hardcodes a personal address or a partner ID.
 */

function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const site = {
  name: "LUXE",
  tagline: "Places worth the flight.",
  description:
    "Luxury travel, imagery first. Find a place by looking at it, see one honest all-in price, and book with an advisor who adds breakfast, a property credit and an upgrade at no extra cost.",
  url: siteUrl(),
  /** Public contact address shown on the site. Set NEXT_PUBLIC_CONTACT_EMAIL. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  /** Host agency the advisors book through, e.g. "Fora Travel". Shown in the footer and on How it works. */
  hostAgency: process.env.NEXT_PUBLIC_HOST_AGENCY || "",
  /** Seller of Travel registration line(s), if any, e.g. "CST #2134567-40". */
  sellerOfTravel: process.env.NEXT_PUBLIC_SELLER_OF_TRAVEL || "",
  /** GetYourGuide partner ID. When set, "Find tours" links earn a commission. */
  gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "",
  /** Business name for the legal pages. */
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "LUXE",
};

export function toursUrl(query: string): string {
  const q = new URLSearchParams({ q: query });
  if (site.gygPartnerId) q.set("partner_id", site.gygPartnerId);
  return `https://www.getyourguide.com/s/?${q.toString()}`;
}
