import { NextResponse } from "next/server";
import { activeProvider } from "@/lib/ai/provider";
import { ratesEnabled } from "@/lib/rates";

/** GET /api/health — uptime check, plus which optional services are switched on. Never reveals keys. */

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      services: {
        inquiries: !!(process.env.RESEND_API_KEY && process.env.INQUIRY_FROM_EMAIL && process.env.INQUIRY_TO_EMAIL),
        ai: activeProvider() ?? false,
        liveRates: ratesEnabled(),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
