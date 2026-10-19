import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { activeProvider, AiError, type Image } from "@/lib/ai/provider";
import { chat, questions, rank, askPlace, itinerary } from "@/lib/ai/tasks";
import { getOrigin } from "@/lib/travel";

/**
 * POST /api/ai — every AI feature on the site.
 * Body: { task: "chat" | "questions" | "rank" | "place" | "itinerary", ...inputs }
 * GET  /api/ai — { enabled } so the UI can hide AI controls when off.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PER_MINUTE = 20;
const MAX_BODY = 3_500_000;

export async function GET() {
  return NextResponse.json({ enabled: activeProvider() !== null }, { headers: { "Cache-Control": "no-store" } });
}

function fail(code: string, error: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ code, error }, { status, headers });
}

function toImage(v: unknown): Image | undefined | "bad" {
  if (v == null || v === "") return undefined;
  if (typeof v !== "string") return "bad";
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(v);
  return m ? { mediaType: m[1], data: m[2] } : "bad";
}

export async function POST(request: Request) {
  if (!activeProvider()) return fail("disabled", "AI is switched off right now.", 503);

  const limit = rateLimit(`ai:${clientKey(request.headers)}`, PER_MINUTE);
  if (!limit.allowed) {
    return fail("rate_limited", "That's a lot of questions at once. Try again in a minute.", 429, {
      "Retry-After": String(limit.retryAfter),
    });
  }

  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY) return fail("too_large", "That request is too large.", 413);
  let b: Record<string, unknown>;
  try {
    b = JSON.parse(raw);
  } catch {
    return fail("invalid_request", "Expected a JSON body.", 400);
  }
  const origin = getOrigin(String(b.origin ?? "")).code;

  try {
    switch (b.task) {
      case "chat":
        return NextResponse.json(await chat(b.messages, origin));
      case "questions":
        return NextResponse.json(await questions(b.text, origin));
      case "rank": {
        const image = toImage(b.image);
        if (image === "bad") return fail("image_rejected", "Send a JPEG, PNG or WebP image.", 400);
        return NextResponse.json(await rank(b.text, b.answers, origin, image));
      }
      case "place":
        return NextResponse.json(await askPlace(b.slug, b.question, origin));
      case "itinerary":
        return NextResponse.json(
          await itinerary({ slug: b.slug, nights: b.nights, travelers: b.travelers, month: b.month, interests: b.interests, origin }),
        );
      default:
        return fail("invalid_request", "Unknown task.", 400);
    }
  } catch (e) {
    if (e instanceof AiError) return fail(e.code, e.message, e.status);
    console.error("[ai] unexpected", e);
    return fail("upstream_error", "Something went wrong. Try again.", 502);
  }
}
