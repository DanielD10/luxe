"use client";

import { useEffect, useState } from "react";

/**
 * Client side of the AI. Features ask /api/ai once whether AI is on and
 * hide themselves when it isn't, so a missing key never shows a
 * visitor a broken button.
 */

let enabledPromise: Promise<boolean> | null = null;

export function aiEnabled(): Promise<boolean> {
  enabledPromise ??= fetch("/api/ai", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((d: { enabled?: boolean }) => !!d.enabled)
    .catch(() => false);
  return enabledPromise;
}

/** null while checking, then true/false. */
export function useAiEnabled(): boolean | null {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    aiEnabled().then((v) => live && setOn(v));
    return () => {
      live = false;
    };
  }, []);
  return on;
}

export class AiCallError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const COPY: Record<string, string> = {
  rate_limited: "That's a lot of questions at once. Give it a minute, then try again.",
  refused: "That's one we can't help with. Try asking another way.",
  invalid_json: "The answer came back garbled. Try again.",
  empty_completion: "No answer came back. Try rephrasing.",
  disabled: "AI is switched off right now.",
  image_rejected: "That image didn't work. Try a JPEG or PNG.",
  too_large: "That's too much to send at once.",
};

export async function callAi<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  } catch {
    if (signal?.aborted) throw new AiCallError("cancelled", "Stopped.");
    throw new AiCallError("network", "Couldn't connect. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = String(data.code ?? "upstream_error");
    throw new AiCallError(code, COPY[code] ?? data.error ?? "Something went wrong. Try again.");
  }
  return data as T;
}

/** Downsizes a photo in the browser before upload: 1024 px long edge, JPEG. */
export async function imageToDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * s));
  c.height = Math.max(1, Math.round(bmp.height * s));
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}
