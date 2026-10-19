import "server-only";

/**
 * Live public rates through SerpApi's Google Hotels engine: the same
 * prices Google shows from Booking.com, Expedia, the hotel's own site
 * and others. Off until SERPAPI_KEY is set.
 *
 * Field names follow SerpApi's documented response; parsing is
 * defensive so a schema change shows "no rate found" rather than an
 * error. Results are cached for 6 hours to save searches.
 */

export type RateSource = { source: string; nightly: number; link?: string };
export type RateResult = {
  hotel: string;
  nightly: number | null;
  total: number | null;
  currency: string;
  sources: RateSource[];
  link?: string;
  checkedAt: string;
};

export function ratesEnabled(): boolean {
  return !!process.env.SERPAPI_KEY;
}

type Money = { lowest?: string; extracted_lowest?: number; before_taxes_fees?: string; extracted_before_taxes_fees?: number };
type SerpProperty = {
  name?: string;
  link?: string;
  property_token?: string;
  rate_per_night?: Money;
  total_rate?: Money;
  prices?: { source?: string; link?: string; rate_per_night?: Money }[];
  featured_prices?: { source?: string; link?: string; rate_per_night?: Money }[];
};

const num = (m?: Money): number | null => {
  if (!m) return null;
  if (typeof m.extracted_lowest === "number") return m.extracted_lowest;
  const s = m.lowest?.replace(/[^\d.]/g, "");
  return s ? Number(s) : null;
};

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);

function bestMatch(props: SerpProperty[], hotel: string): SerpProperty | undefined {
  const want = new Set(words(hotel));
  let best: SerpProperty | undefined;
  let score = 0;
  for (const p of props) {
    const got = words(p.name ?? "");
    const s = got.filter((w) => want.has(w)).length / Math.max(1, want.size);
    if (s > score) {
      score = s;
      best = p;
    }
  }
  return score >= 0.5 ? best : undefined;
}

async function serp(params: Record<string, string>): Promise<Record<string, unknown>> {
  const q = new URLSearchParams({ engine: "google_hotels", currency: "USD", gl: "us", hl: "en", ...params, api_key: process.env.SERPAPI_KEY! });
  const res = await fetch(`https://serpapi.com/search.json?${q.toString()}`, {
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 21_600 },
  });
  if (!res.ok) throw new Error(`SerpApi ${res.status}`);
  return res.json();
}

export async function publicRate(input: { hotel: string; place: string; checkIn: string; checkOut: string; adults: number }): Promise<RateResult | null> {
  const base = { check_in_date: input.checkIn, check_out_date: input.checkOut, adults: String(input.adults) };
  const search = await serp({ ...base, q: `${input.hotel} ${input.place}` });

  // A specific hotel query often returns that property's details directly.
  let prop: SerpProperty | undefined =
    typeof search.name === "string" && (search.prices || search.rate_per_night) ? (search as SerpProperty) : undefined;
  if (!prop) prop = bestMatch((search.properties as SerpProperty[]) ?? [], input.hotel);
  if (!prop) return null;

  if (!prop.prices && prop.property_token) {
    try {
      const details = (await serp({ ...base, q: `${input.hotel} ${input.place}`, property_token: prop.property_token })) as SerpProperty;
      prop = { ...prop, ...details };
    } catch {
      /* the summary rate is still useful */
    }
  }

  const sources: RateSource[] = [...(prop.featured_prices ?? []), ...(prop.prices ?? [])]
    .map((x) => ({ source: x.source ?? "", nightly: num(x.rate_per_night) ?? 0, link: x.link }))
    .filter((x) => x.source && x.nightly > 0)
    .filter((x, i, a) => a.findIndex((y) => y.source === x.source) === i)
    .sort((a, b) => a.nightly - b.nightly)
    .slice(0, 5);

  const nightly = num(prop.rate_per_night) ?? sources[0]?.nightly ?? null;
  return {
    hotel: prop.name ?? input.hotel,
    nightly,
    total: num(prop.total_rate),
    currency: "USD",
    sources,
    link: prop.link,
    checkedAt: new Date().toISOString(),
  };
}
