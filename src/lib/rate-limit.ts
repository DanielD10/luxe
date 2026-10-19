/**
 * Fixed-window rate limiter held in process memory.
 *
 * On Vercel each serverless instance keeps its own counter, so a
 * determined attacker spread across cold instances gets more than the
 * stated limit. It stops casual abuse of the AI and inquiry routes. If
 * either is abused for real, move this to Upstash Redis; the interface
 * is deliberately small so that swap is easy.
 */

type Entry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_TRACKED_KEYS = 5_000;
const hits = new Map<string, Entry>();

function sweep(now: number): void {
  for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
}

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfter: number };

export function rateLimit(key: string, max: number): RateLimitResult {
  const now = Date.now();
  if (hits.size > MAX_TRACKED_KEYS) sweep(now);
  const existing = hits.get(key);
  if (!existing || existing.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: max - 1, retryAfter: Math.ceil(WINDOW_MS / 1000) };
  }
  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > max) return { allowed: false, remaining: 0, retryAfter };
  return { allowed: true, remaining: max - existing.count, retryAfter };
}

/** Vercel sets x-forwarded-for; the first entry is the client. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
