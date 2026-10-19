import "server-only";
import { destinations, getDestination, MONTHS, bestMonths, monthRanges, BAND_LABEL } from "@/lib/destinations";
import { countries } from "@/lib/countries";
import { doorToDoor, getOrigin } from "@/lib/travel";
import { complete, parseJson, AiError, type Image, type Turn } from "./provider";

/**
 * Every AI feature is a fixed task with a server-side prompt. The page
 * sends only the traveler's words and choices, never a prompt, so the
 * route can't be used as a free general-purpose chatbot, and the
 * catalog stays the single source of facts.
 */

const SLUGS = new Set(destinations.map((d) => d.slug));
const clip = (s: unknown, n: number) => String(s ?? "").slice(0, n).trim();

function catalog(origin: string): string {
  return destinations
    .map((d) => {
      const dd = doorToDoor(d, origin);
      return `${d.slug} | ${d.name}, ${d.country} | ${d.feelings.join("/")} | best ${monthRanges(bestMonths(d))} | luxury nightly ${BAND_LABEL[d.band]} | ~${dd.hours}h door to door | ${d.summary}`;
    })
    .join("\n");
}

const VOICE =
  "Write the way a well-travelled friend talks: direct, warm, short sentences, no hype. Plain text only, no markdown. Never invent prices, availability, hotel facts or entry rules beyond what's given. LUXE advisors book at the public rate or better, add perks (daily breakfast for two, a $100 property credit, an upgrade when available, 4 pm checkout when available), and charge no booking fee.";

function base(origin: string): string {
  const o = getOrigin(origin);
  return `You are the concierge inside LUXE, a luxury travel booking site. The traveler flies from ${o.city} (${o.code}). ${VOICE}\n\nLUXE's destinations (slug | name | feelings | best months | typical luxury nightly | door-to-door estimate | summary):\n${catalog(origin)}`;
}

const slugList = (x: unknown, max: number): string[] =>
  (Array.isArray(x) ? x : [])
    .map(String)
    .filter((s, i, a) => SLUGS.has(s) && a.indexOf(s) === i)
    .slice(0, max);

/* ---------- chat ---------- */

export async function chat(messages: unknown, origin: string) {
  const turns: Turn[] = (Array.isArray(messages) ? messages : [])
    .slice(-12)
    .map((m) => ({ role: (m?.role === "assistant" ? "assistant" : "user") as Turn["role"], content: clip(m?.content, 1200) }))
    .filter((t) => t.content);
  if (!turns.length || turns[turns.length - 1].role !== "user") {
    throw new AiError("invalid_request", "Send a message.", 400);
  }
  const rules = `${base(origin)}\n\nAnswer the traveler's messages that follow. Recommend only LUXE destinations, by slug, up to 4. If they want to book or get a price, say an advisor confirms live availability and sends an all-in quote within a day, and point them to the Plan a trip page. Reply as JSON: {"reply": "under 110 words", "places": ["slug"]}.`;
  const raw = await complete([{ role: "user", content: rules }, ...turns], { json: true });
  const out = parseJson(raw) as { reply?: unknown; places?: unknown };
  const reply = clip(out?.reply, 1500);
  if (!reply) throw new AiError("empty_completion", "No answer came back.");
  return { reply, places: slugList(out?.places, 4) };
}

/* ---------- matchmaker: tailored questions ---------- */

export async function questions(text: unknown, origin: string) {
  const t = clip(text, 600);
  if (!t) throw new AiError("invalid_request", "Tell us about the trip first.", 400);
  const raw = await complete(
    [
      {
        role: "user",
        content: `${base(origin)}\n\nA traveler described their trip: """${t}"""\n\nWrite exactly 3 short follow-up questions that would most change which LUXE destination fits them. Don't ask anything they already answered. Each has 3 or 4 options under 6 words. Reply as JSON: {"questions":[{"q":"How long are you happy to fly?","options":["Under 12 hours","Up to 20","Distance doesn't matter"]}]}`,
      },
    ],
    { json: true },
  );
  const out = parseJson(raw) as { questions?: unknown };
  const qs = (Array.isArray(out?.questions) ? out.questions : [])
    .map((q: { q?: unknown; options?: unknown }) => ({
      q: clip(q?.q, 120),
      options: (Array.isArray(q?.options) ? q.options : []).map((o: unknown) => clip(o, 50)).filter(Boolean).slice(0, 4),
    }))
    .filter((q: { q: string; options: string[] }) => q.q && q.options.length >= 2)
    .slice(0, 3);
  if (!qs.length) throw new AiError("invalid_json", "The questions came back garbled.");
  return { questions: qs };
}

/* ---------- matchmaker: rank ---------- */

export async function rank(text: unknown, answers: unknown, origin: string, image?: Image) {
  const t = clip(text, 600);
  const a = (Array.isArray(answers) ? answers : []).map((x) => clip(x, 200)).filter(Boolean).slice(0, 6);
  if (!t && !a.length && !image) throw new AiError("invalid_request", "Tell us about the trip first.", 400);
  const about = image
    ? `The attached photo shows the feeling this traveler wants from a trip: read its landscape, light, temperature and mood.${t ? ` They also wrote: """${t}"""` : ""}`
    : `The traveler wrote: """${t}"""\nTheir answers:\n${a.join("\n") || "(none)"}`;
  const raw = await complete(
    [
      {
        role: "user",
        content: `${base(origin)}\n\n${about}\n\nPick the 6 LUXE destinations that fit best, best first. Be honest about trade-offs like flight time, season and price. Reply as JSON: {"picks":[{"slug":"kyoto","fit":87,"why":"one sentence, specific to them","watchOut":"one sentence, or empty","bestMonth":"Nov"}]}. fit is 0-100.`,
      },
    ],
    { json: true, image },
  );
  const out = parseJson(raw) as { picks?: unknown };
  const seen = new Set<string>();
  const picks = (Array.isArray(out?.picks) ? out.picks : [])
    .map((p: { slug?: unknown; fit?: unknown; why?: unknown; watchOut?: unknown; bestMonth?: unknown }) => ({
      slug: String(p?.slug ?? ""),
      fit: Math.max(0, Math.min(100, Math.round(Number(p?.fit) || 0))),
      why: clip(p?.why, 240),
      watchOut: clip(p?.watchOut, 240),
      bestMonth: MONTHS.includes(String(p?.bestMonth)) ? String(p?.bestMonth) : "",
    }))
    .filter((p: { slug: string }) => SLUGS.has(p.slug) && !seen.has(p.slug) && seen.add(p.slug))
    .slice(0, 6);
  if (!picks.length) throw new AiError("invalid_json", "The ranking came back garbled.");
  return { picks };
}

/* ---------- ask about one place ---------- */

export async function askPlace(slug: unknown, question: unknown, origin: string) {
  const d = getDestination(String(slug));
  if (!d) throw new AiError("invalid_request", "Unknown destination.", 400);
  const q = clip(question, 400);
  if (!q) throw new AiError("invalid_request", "Ask a question.", 400);
  const c = countries[d.countryKey];
  const facts = {
    name: d.name,
    country: d.country,
    summary: d.summary,
    bestMonths: monthRanges(bestMonths(d)),
    monthByMonth: d.months,
    monthNotes: Object.fromEntries(Object.entries(d.monthNotes).map(([k, v]) => [MONTHS[Number(k)], v])),
    highlights: d.highlights,
    stays: d.stays,
    gettingThere: `${d.gateway.code}, then ${d.gateway.lastLegNote.toLowerCase()}; about ${doorToDoor(d, origin).hours} hours door to door`,
    typicalNightly: BAND_LABEL[d.band],
    currency: c.currency,
    plugs: c.plugs,
    entryForUSPassport: c.entry,
  };
  const raw = await complete(
    [
      {
        role: "user",
        content: `You are the concierge inside LUXE, a luxury travel booking site. ${VOICE}\nFacts about ${d.name} (month codes Jan-Dec: 2 best, 1 good, 0 off-season, x closed):\n${JSON.stringify(facts)}\n\nIf the question needs facts you don't have, say so and offer to have an advisor check. Answer in under 90 words.\n\nTraveler's question: """${q}"""\n\nReply as JSON: {"reply": "..."}`,
      },
    ],
    { json: true },
  );
  const out = parseJson(raw) as { reply?: unknown };
  const reply = clip(out?.reply, 1200);
  if (!reply) throw new AiError("empty_completion", "No answer came back.");
  return { reply };
}

/* ---------- itinerary draft ---------- */

export async function itinerary(input: {
  slug: unknown;
  nights: unknown;
  travelers: unknown;
  month: unknown;
  interests: unknown;
  origin: string;
}) {
  const d = getDestination(String(input.slug));
  if (!d) throw new AiError("invalid_request", "Pick a destination.", 400);
  const nights = Math.max(2, Math.min(14, Math.round(Number(input.nights) || d.nights)));
  const travelers = Math.max(1, Math.min(12, Math.round(Number(input.travelers) || 2)));
  const m = Number(input.month);
  const month = Number.isInteger(m) && m >= 0 && m <= 11 ? m : null;
  const interests = clip(input.interests, 600);
  const raw = await complete(
    [
      {
        role: "user",
        content: `You draft day-by-day plans for LUXE, a luxury travel site. ${VOICE}
Destination: ${d.name}, ${d.country}. ${d.summary}
Highlights to draw from: ${d.highlights.join("; ")}.
Recommended stays: ${d.stays.map((s) => `${s.name} (${s.area})`).join("; ")}.
Arrival: long-haul into ${d.gateway.code}, then ${d.gateway.lastLegNote.toLowerCase()} (about ${d.gateway.lastLeg} h). Door to door is about ${doorToDoor(d, input.origin).hours} hours.
${month !== null ? `Travel month: ${MONTHS[month]}. Season there: ${d.months[month] === "2" ? "best" : d.months[month] === "1" ? "good" : d.months[month] === "x" ? "many hotels closed" : "off-season"}${d.monthNotes[month] ? ` (${d.monthNotes[month]})` : ""}.` : ""}
Nights: ${nights}. Travelers: ${travelers}.
What they care about: """${interests || "not specified"}"""

Rules: day 1 is arrival, so keep it light. The last day is departure. Leave at least one unscheduled half day. Don't stack long drives. Only name places and activities that really exist there. Days = nights + 1.
Reply as JSON: {"summary":"two sentences","stay":"best of the recommended stays for them","days":[{"title":"short","morning":"…","afternoon":"…","evening":"…","pace":"easy|full|free"}],"tips":["up to 3 short practical tips"]}`,
      },
    ],
    { json: true },
  );
  const out = parseJson(raw) as { summary?: unknown; stay?: unknown; days?: unknown; tips?: unknown };
  const days = (Array.isArray(out?.days) ? out.days : [])
    .slice(0, nights + 1)
    .map((x: { title?: unknown; morning?: unknown; afternoon?: unknown; evening?: unknown; pace?: unknown }) => ({
      title: clip(x?.title, 80),
      morning: clip(x?.morning, 260),
      afternoon: clip(x?.afternoon, 260),
      evening: clip(x?.evening, 260),
      pace: ["easy", "full", "free"].includes(String(x?.pace)) ? String(x?.pace) : "easy",
    }))
    .filter((x: { title: string }) => x.title);
  if (!days.length) throw new AiError("invalid_json", "The plan came back garbled.");
  const stay = d.stays.find((s) => String(out?.stay ?? "").toLowerCase().includes(s.name.toLowerCase().slice(0, 8)))?.name ?? "";
  return {
    summary: clip(out?.summary, 400),
    stay,
    days,
    tips: (Array.isArray(out?.tips) ? out.tips : []).map((t: unknown) => clip(t, 200)).filter(Boolean).slice(0, 3),
    nights,
  };
}
