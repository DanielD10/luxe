"use client";

import { useRef, useState } from "react";
import { AiCallError, callAi, useAiEnabled } from "@/lib/client/ai";
import { useOrigin } from "@/lib/client/store";

const CHIPS = ["Is it good for a honeymoon?", "Is it OK with kids?", "What would I regret not packing?", "Is 3 nights enough?"];

export default function AskPlace({ slug, name }: { slug: string; name: string }) {
  const enabled = useAiEnabled();
  const origin = useOrigin();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ctl = useRef<AbortController | null>(null);

  if (!enabled) return null;

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    setQ(text);
    setBusy(true);
    setError("");
    setAnswer("");
    ctl.current = new AbortController();
    try {
      const r = await callAi<{ reply: string }>({ task: "place", slug, question: text, origin }, ctl.current.signal);
      setAnswer(r.reply);
    } catch (e) {
      const err = e as AiCallError;
      if (err.code !== "cancelled") setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h3>
        Ask about {name} <span className="ai-tag">AI</span>
      </h3>
      <div className="qrow" style={{ margin: "6px 0 12px" }}>
        {CHIPS.map((c) => (
          <button key={c} className="btn sm" onClick={() => ask(c)} disabled={busy}>
            {c}
          </button>
        ))}
      </div>
      <form
        style={{ display: "flex", gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <label className="sr-only" htmlFor="ap-q">Your question</label>
        <input id="ap-q" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Anything: weather, kids, knees, Wi-Fi…" maxLength={400} />
        {busy ? (
          <button type="button" className="btn" onClick={() => ctl.current?.abort()}>Stop</button>
        ) : (
          <button className="btn solid" disabled={!q.trim()}>Ask</button>
        )}
      </form>
      {busy ? <p className="thinking" style={{ marginTop: 14 }}>Thinking</p> : null}
      {error ? <p className="notice bad" style={{ marginTop: 14 }}>{error}</p> : null}
      {answer ? <p className="answer" aria-live="polite">{answer}</p> : null}
      <p className="ai-note" style={{ marginTop: 12 }}>AI answers from what we know about {name}. Your advisor confirms anything that matters before you book.</p>
    </div>
  );
}
