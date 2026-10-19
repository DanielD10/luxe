import { getDestination } from "@/lib/destinations";

/**
 * The trip request: one schema, used by the form for instant feedback
 * and by the API route as the real gate.
 */

export const BUDGETS = ["Under $600 a night", "$600–1,200 a night", "$1,200–2,500 a night", "$2,500+ a night", "Not sure yet"] as const;
export const INTERESTS = [
  "Food & wine",
  "Beaches",
  "Hiking",
  "Wildlife",
  "Spa",
  "Culture & history",
  "Snow & skiing",
  "Diving & snorkeling",
  "Nightlife",
  "Kids along",
  "Accessibility needs",
] as const;
export const OCCASIONS = ["Just because", "Honeymoon", "Anniversary", "Birthday", "Family trip", "Friends' trip", "Proposal"] as const;

export type Inquiry = {
  destinations: string[];
  when: string;
  nights: number;
  adults: number;
  children: number;
  budget: string;
  interests: string[];
  occasion: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  origin: string;
  itinerary: string;
  consent: boolean;
  /** Honeypot: real people never fill this. */
  company: string;
};

export type InquiryErrors = Partial<Record<keyof Inquiry, string>>;

const EMAIL = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/;
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const int = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
};

export function validateInquiry(raw: unknown): { ok: boolean; errors: InquiryErrors; value: Inquiry } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const value: Inquiry = {
    destinations: (Array.isArray(r.destinations) ? r.destinations : [])
      .map(String)
      .filter((s, i, a) => !!getDestination(s) && a.indexOf(s) === i)
      .slice(0, 6),
    when: str(r.when, 80),
    nights: int(r.nights, 1, 60, 7),
    adults: int(r.adults, 1, 20, 2),
    children: int(r.children, 0, 10, 0),
    budget: BUDGETS.includes(r.budget as (typeof BUDGETS)[number]) ? String(r.budget) : "Not sure yet",
    interests: (Array.isArray(r.interests) ? r.interests : []).map(String).filter((s) => (INTERESTS as readonly string[]).includes(s)),
    occasion: (OCCASIONS as readonly string[]).includes(String(r.occasion)) ? String(r.occasion) : "Just because",
    name: str(r.name, 80),
    email: str(r.email, 120),
    phone: str(r.phone, 40),
    notes: str(r.notes, 2000),
    origin: str(r.origin, 3).toUpperCase(),
    itinerary: str(r.itinerary, 6000),
    consent: r.consent === true,
    company: str(r.company, 100),
  };
  const errors: InquiryErrors = {};
  if (!value.destinations.length && !value.notes) errors.destinations = "Pick at least one place, or tell us what you have in mind.";
  if (!value.when) errors.when = "Roughly when? A month is fine.";
  if (value.name.length < 2) errors.name = "Your name, please.";
  if (!EMAIL.test(value.email)) errors.email = "That email doesn't look right.";
  if (value.phone && !/^[+()\d\s.-]{7,}$/.test(value.phone)) errors.phone = "Numbers, spaces and + only.";
  if (!value.consent) errors.consent = "Please agree so we can contact you about this trip.";
  return { ok: Object.keys(errors).length === 0, errors, value };
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Strips CR/LF so user text can never inject email headers. */
export function headerSafe(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}
