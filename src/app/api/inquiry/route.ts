import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { validateInquiry, escapeHtml, headerSafe, type Inquiry } from "@/lib/inquiry";
import { getDestination } from "@/lib/destinations";
import { getOrigin } from "@/lib/travel";
import { site } from "@/lib/site";

/**
 * POST /api/inquiry — a trip request.
 *
 * Validates, rate-limits, then emails it to the advisor through Resend
 * and sends the traveler a confirmation. In production a missing email
 * setup is an error (a lead must never vanish silently); in preview and
 * local dev the request is logged instead so the form can be tested.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function lines(v: Inquiry): [string, string][] {
  const places = v.destinations.map((s) => getDestination(s)?.name ?? s).join(", ") || "Open to ideas";
  return [
    ["Places", places],
    ["When", v.when],
    ["Nights", String(v.nights)],
    ["Travelers", `${v.adults} adult${v.adults > 1 ? "s" : ""}${v.children ? `, ${v.children} child${v.children > 1 ? "ren" : ""}` : ""}`],
    ["Budget", v.budget],
    ["Occasion", v.occasion],
    ["Interests", v.interests.join(", ") || "—"],
    ["Flying from", v.origin ? `${getOrigin(v.origin).city} (${getOrigin(v.origin).code})` : "—"],
    ["Name", v.name],
    ["Email", v.email],
    ["Phone", v.phone || "—"],
    ["Notes", v.notes || "—"],
  ];
}

function advisorEmail(v: Inquiry) {
  const rows = lines(v);
  const text = rows.map(([k, val]) => `${k}: ${val}`).join("\n") + (v.itinerary ? `\n\nDraft itinerary:\n${v.itinerary}` : "");
  const html = `<h2 style="font-family:Georgia,serif;font-weight:400">New trip request</h2><table cellpadding="6" style="border-collapse:collapse;font:14px/1.5 -apple-system,Segoe UI,sans-serif">${rows
    .map(([k, val]) => `<tr><td style="color:#666;vertical-align:top">${escapeHtml(k)}</td><td>${escapeHtml(val).replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table>${v.itinerary ? `<h3 style="font-family:Georgia,serif;font-weight:400">Draft itinerary</h3><pre style="white-space:pre-wrap;font:13px/1.5 -apple-system,sans-serif">${escapeHtml(v.itinerary)}</pre>` : ""}`;
  return { text, html };
}

function travelerEmail(v: Inquiry) {
  const first = v.name.split(" ")[0];
  const text = `Hi ${first},\n\nThanks for your trip request. An advisor will reply within one business day with live availability, an all-in price, and the perks that come with booking through us.\n\nWhat you sent:\n${lines(v)
    .filter(([k]) => !["Name", "Email", "Phone"].includes(k))
    .map(([k, val]) => `${k}: ${val}`)
    .join("\n")}\n\n${site.name}`;
  const html = `<p>Hi ${escapeHtml(first)},</p><p>Thanks for your trip request. An advisor will reply within one business day with live availability, an all-in price, and the perks that come with booking through us.</p><p style="color:#666">${lines(v)
    .filter(([k]) => !["Name", "Email", "Phone"].includes(k))
    .map(([k, val]) => `${escapeHtml(k)}: ${escapeHtml(val)}`)
    .join("<br>")}</p><p>${escapeHtml(site.name)}</p>`;
  return { text, html };
}

async function send(apiKey: string, body: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

export async function POST(request: Request) {
  const limit = rateLimit(`inquiry:${clientKey(request.headers)}`, 5);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const { ok, errors, value } = validateInquiry(payload);
  if (!ok) return NextResponse.json({ error: "Check the highlighted fields.", errors }, { status: 400 });

  // Honeypot: tell the bot it worked.
  if (value.company) return NextResponse.json({ ok: true }, { status: 200 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INQUIRY_FROM_EMAIL;
  const to = process.env.INQUIRY_TO_EMAIL;

  if (!apiKey || !from || !to) {
    if (process.env.VERCEL_ENV === "production") {
      console.error("[inquiry] email delivery is not configured in production");
      return NextResponse.json(
        { error: site.email ? `We couldn't send this right now. Email us at ${site.email}.` : "We couldn't send this right now. Please try again later." },
        { status: 503 },
      );
    }
    console.info("[inquiry] delivery not configured; logged only", { places: value.destinations, when: value.when, email: value.email });
    return NextResponse.json({ ok: true, delivered: false });
  }

  const subjectPlaces = value.destinations.map((s) => getDestination(s)?.name ?? s).join(", ") || "Open to ideas";
  try {
    const a = advisorEmail(value);
    await send(apiKey, {
      from,
      to: [to],
      reply_to: value.email,
      subject: headerSafe(`Trip request: ${subjectPlaces} · ${value.when} · ${value.name}`),
      text: a.text,
      html: a.html,
    });
  } catch (e) {
    console.error("[inquiry] advisor email failed", e);
    return NextResponse.json(
      { error: site.email ? `We couldn't send this right now. Email us at ${site.email}.` : "We couldn't send this right now. Please try again." },
      { status: 502 },
    );
  }

  // The confirmation is a courtesy; failing it shouldn't fail the request.
  try {
    const t = travelerEmail(value);
    await send(apiKey, {
      from,
      to: [value.email],
      reply_to: to,
      subject: headerSafe(`We've got your trip request: ${subjectPlaces}`),
      text: t.text,
      html: t.html,
    });
  } catch (e) {
    console.warn("[inquiry] confirmation email failed", e);
  }

  return NextResponse.json({ ok: true, delivered: true });
}
