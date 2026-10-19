import "server-only";

/**
 * One call shape for two providers. Off until LUXE_AI_PROVIDER and the
 * matching key are set. Plain fetch to each REST API, no SDKs.
 */

export type Role = "user" | "assistant";
export type Turn = { role: Role; content: string };
export type Image = { mediaType: string; data: string };
export type Provider = "anthropic" | "gemini";

export class AiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

const MAX_OUTPUT_TOKENS = 2048;
const TIMEOUT_MS = 55_000;

const DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: "claude-haiku-5-5",
  gemini: "gemini-flash-latest",
};

export function activeProvider(): Provider | null {
  const p = (process.env.LUXE_AI_PROVIDER ?? "").trim().toLowerCase();
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (p === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

/** Merges repeated roles; the conversation must start and end with the user. */
export function normalizeTurns(turns: Turn[]): Turn[] {
  const out: Turn[] = [];
  for (const t of turns) {
    if (!t.content.trim()) continue;
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.content += "\n\n" + t.content;
    else out.push({ ...t });
  }
  if (!out.length || out[0].role !== "user" || out[out.length - 1].role !== "user") {
    throw new AiError("invalid_request", "Conversation must start and end with the traveler.", 400);
  }
  return out;
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new AiError("upstream_error", "Couldn't reach the AI provider.");
  }
  if (res.status === 429) throw new AiError("rate_limited", "The AI provider is busy. Try again in a minute.", 429);
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 400);
    console.error("[ai] provider error", res.status, detail);
    throw new AiError("upstream_error", "The AI provider returned an error.");
  }
  return res.json();
}

export async function complete(turns: Turn[], opts: { json?: boolean; image?: Image } = {}): Promise<string> {
  const provider = activeProvider();
  if (!provider) throw new AiError("disabled", "AI is switched off.", 503);
  const msgs = normalizeTurns(turns);
  if (opts.json) msgs[msgs.length - 1].content += "\n\nReply with only one JSON value and no other text.";
  const last = msgs.length - 1;
  const model = process.env.LUXE_AI_MODEL || DEFAULT_MODEL[provider];

  if (provider === "anthropic") {
    const data = (await post(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      {
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: msgs.map((t, i) => ({
          role: t.role,
          content:
            i === last && opts.image
              ? [
                  { type: "image", source: { type: "base64", media_type: opts.image.mediaType, data: opts.image.data } },
                  { type: "text", text: t.content },
                ]
              : t.content,
        })),
      },
    )) as { content?: { type: string; text?: string }[]; stop_reason?: string };
    if (data.stop_reason === "refusal") throw new AiError("refused", "The model declined this one.", 422);
    if (data.stop_reason === "max_tokens" && opts.json) throw new AiError("invalid_json", "The answer was cut short.");
    return (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  }

  const data = (await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    { "x-goog-api-key": process.env.GEMINI_API_KEY! },
    {
      contents: msgs.map((t, i) => ({
        role: t.role === "assistant" ? "model" : "user",
        parts: [
          ...(i === last && opts.image ? [{ inline_data: { mime_type: opts.image.mediaType, data: opts.image.data } }] : []),
          { text: t.content },
        ],
      })),
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS * 2,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    },
  )) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };
  const cand = data.candidates?.[0];
  if (data.promptFeedback?.blockReason || cand?.finishReason === "SAFETY") {
    throw new AiError("refused", "The model declined this one.", 422);
  }
  if (cand?.finishReason === "MAX_TOKENS" && opts.json) throw new AiError("invalid_json", "The answer was cut short.");
  return (cand?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

/** Accepts the whole reply, a fenced block, or first bracket to last. */
export function parseJson(text: string): unknown {
  const tries = [text.trim()];
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fence) tries.push(fence[1].trim());
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (start >= 0 && end > start) tries.push(text.slice(start, end + 1));
  for (const t of tries) {
    try {
      return JSON.parse(t);
    } catch {
      /* next shape */
    }
  }
  throw new AiError("invalid_json", "The reply wasn't valid JSON.");
}
