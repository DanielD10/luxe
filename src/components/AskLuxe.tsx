"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CardData } from "@/lib/cards";
import { AiCallError, callAi, useAiEnabled } from "@/lib/client/ai";
import { useOrigin } from "@/lib/client/store";
import Photo from "./Photo";
import { SparkIcon } from "./Icons";

type Msg = { role: "user" | "assistant"; content: string; places?: string[]; error?: boolean };

const SUGGEST = [
  "Somewhere warm in February, under 15 hours away",
  "Best honeymoon pick if we hate crowds",
  "Safari for first-timers: where and when?",
  "Kyoto or the Dolomites in October?",
];

/** The site-wide concierge. Hidden entirely when AI is off. */
export default function AskLuxe({ cards }: { cards: CardData[] }) {
  const enabled = useAiEnabled();
  const origin = useOrigin();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const ctl = useRef<AbortController | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const bySlug = new Map(cards.map((c) => [c.slug, c]));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onOpen = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<string>).detail;
      if (q) setTimeout(() => send(q), 50);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("luxe:ask", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("luxe:ask", onOpen);
    };
  });

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 80);
  }, [open]);
  useEffect(() => {
    list.current?.scrollTo({ top: 1e9 });
  }, [msgs, busy]);

  async function send(raw: string) {
    const q = raw.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setText("");
    setBusy(true);
    ctl.current = new AbortController();
    try {
      const r = await callAi<{ reply: string; places: string[] }>(
        { task: "chat", origin, messages: next.filter((m) => !m.error).map(({ role, content }) => ({ role, content })) },
        ctl.current.signal,
      );
      setMsgs((m) => [...m, { role: "assistant", content: r.reply, places: r.places }]);
    } catch (e) {
      const err = e as AiCallError;
      if (err.code === "cancelled") setMsgs((m) => m.slice(0, -1));
      else setMsgs((m) => [...m, { role: "assistant", content: err.message, error: true }]);
    } finally {
      setBusy(false);
      ctl.current = null;
    }
  }

  if (!enabled) return null;

  return (
    <>
      <button className="fab" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <SparkIcon /> Ask LUXE
      </button>
      <div className={`scrim${open ? " on" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sheet${open ? " on" : ""}`} role="dialog" aria-modal="true" aria-label="Ask LUXE" aria-hidden={!open}>
        <div className="sheet-head">
          <h2>Ask LUXE</h2>
          <span className="ai-tag">AI</span>
          <button className="x" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="msgs" ref={list} aria-live="polite">
          <div className="msg them">
            Tell me what kind of trip you want, or ask about any place. I know every destination, season and travel time on LUXE.
          </div>
          {!msgs.length ? (
            <div className="qrow" style={{ flexDirection: "column" }}>
              {SUGGEST.map((s) => (
                <button key={s} className="btn sm" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "contents" }}>
              <div className={`msg ${m.role === "user" ? "me" : "them"}`}>{m.content}</div>
              {m.places?.length ? (
                <div className="msg-places">
                  {m.places.map((s) => {
                    const c = bySlug.get(s);
                    return c ? (
                      <Link key={s} href={`/destinations/${s}`} className="mini" onClick={() => setOpen(false)}>
                        <Photo photo={c.photo} sizes="72px" ratio={4 / 3} credit={false} />
                        <span>
                          <b>{c.name}</b>
                          <span>{c.country}</span>
                        </span>
                      </Link>
                    ) : null;
                  })}
                </div>
              ) : null}
            </div>
          ))}
          {busy ? <div className="msg them thinking">Thinking</div> : null}
        </div>
        <form
          className="sheet-form"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <label className="sr-only" htmlFor="ask-input">Message</label>
          <input id="ask-input" ref={input} className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Where should we go in March?" autoComplete="off" maxLength={1200} />
          {busy ? (
            <button type="button" className="btn" onClick={() => ctl.current?.abort()}>
              Stop
            </button>
          ) : (
            <button className="btn solid" disabled={!text.trim()}>
              Send
            </button>
          )}
        </form>
      </aside>
    </>
  );
}

/** Opens the concierge from anywhere, optionally with a question. */
export function openAsk(question?: string) {
  window.dispatchEvent(new CustomEvent("luxe:ask", { detail: question ?? "" }));
}
