import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { getDestination } from "@/lib/destinations";
import { publicRate, ratesEnabled } from "@/lib/rates";
import { perksValue } from "@/lib/travel";

/**
 * POST /api/rates — today's public rate for one recommended stay,
 * next to what the LUXE perks are worth.
 * Body: { slug, stay (index), checkIn "YYYY-MM-DD", checkOut, adults }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  return NextResponse.json({ enabled: ratesEnabled() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!ratesEnabled()) return NextResponse.json({ code: "disabled", error: "Live rates are off." }, { status: 503 });

  const limit = rateLimit(`rates:${clientKey(request.headers)}`, 8);
  if (!limit.allowed) {
    return NextResponse.json(
      { code: "rate_limited", error: "Too many checks. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request", error: "Expected a JSON body." }, { status: 400 });
  }

  const d = getDestination(String(b.slug));
  const stay = d?.stays[Number(b.stay)];
  const checkIn = String(b.checkIn ?? "");
  const checkOut = String(b.checkOut ?? "");
  const adults = Math.max(1, Math.min(6, Math.round(Number(b.adults) || 2)));
  if (!d || !stay || !DATE.test(checkIn) || !DATE.test(checkOut)) {
    return NextResponse.json({ code: "invalid_request", error: "Pick a stay and dates." }, { status: 400 });
  }
  const inDate = new Date(checkIn + "T00:00:00Z");
  const outDate = new Date(checkOut + "T00:00:00Z");
  const nights = Math.round((outDate.getTime() - inDate.getTime()) / 86_400_000);
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  if (!(nights >= 1 && nights <= 30) || inDate < today) {
    return NextResponse.json({ code: "invalid_request", error: "Check-in must be today or later, for 1 to 30 nights." }, { status: 400 });
  }

  try {
    const rate = await publicRate({ hotel: stay.name, place: `${stay.area}, ${d.country}`, checkIn, checkOut, adults });
    return NextResponse.json({ rate, nights, perks: perksValue(nights) });
  } catch (e) {
    console.error("[rates] lookup failed", e);
    return NextResponse.json({ code: "upstream_error", error: "Couldn't fetch rates right now." }, { status: 502 });
  }
}
