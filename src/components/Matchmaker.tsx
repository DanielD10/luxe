"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { CardData } from "@/lib/cards";
import { AiCallError, callAi, imageToDataUrl, useAiEnabled } from "@/lib/client/ai";
import { toggleSaved, toast, useOrigin, useSaved } from "@/lib/client/store";
import Photo from "./Photo";

type Q = { q: string; options: string[] };
type Pick = { slug: string; fit: number; why: string; watchOut: string; bestMonth: string };

/**
 * "Not sure where?" Describe the trip in a sentence; LUXE asks the
 * questions that matter for that trip, then ranks the catalog. Or match
 * a photo. Hidden when AI is off.
 */
export default function Matchmaker({ cards }: { cards: CardData[] }) {
  const enabled = useAiEnabled();
  const origin = useOrigin();
  const saved = useSaved();
  const [text, setText] = useState("");
  const [qs, setQs] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [picks, setPicks] = useState<Pick[]>([]);
  const [busy, setBusy] = useState<"" | "questions" | "rank" | "photo">("");
  const [error, setError] = useState("");
  const ctl = useRef<AbortController | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const bySlug = new Map(cards.map((c) => [c.slug, c]));

  if (enabled === false) return null;

  async function run<T>(kind: typeof busy, body: Record<string, unknown>): Promise<T | null> {
    setBusy(kind);
    setError("");
    ctl.current = new AbortController();
    try {
      return await callAi<T>({ ...body, origin }, ctl.current.signal);
    } catch (e) {
      const err = e as AiCallError;
      if (err.code !== "cancelled") setError(err.message);
      return null;
    } finally {
      setBusy("");
      ctl.current = null;
    }
  }

  async function ask() {
    if (!text.trim()) {
      setError("Write a sentence about the trip first: who's going, what you love, what you'd skip.");
      return;
    }
    setPicks([]);
    setAnswers({});
    const r = await run<{ questions: Q[] }>("questions", { task: "questions", text });
    if (r) setQs(r.questions);
  }

  async function rank() {
    const ans = qs.map((q, i) => (answers[i] !== undefined ? `${q.q} ${q.options[answers[i]]}` : null)).filter(Boolean);
    const r = await run<{ picks: Pick[] }>("rank", { task: "rank", text, answers: ans });
    if (r) setPicks(r.picks);
  }

  async function photo(f: File) {
    let image: string;
    try {
      image = await imageToDataUrl(f);
    } catch {
      setError("That image didn't work. Try a JPEG or PNG.");
      return;
    }
    setQs([]);
    const r = await run<{ picks: Pick[] }>("photo", { task: "rank", text, image });
    if (r) setPicks(r.picks);
  }

  const waiting = { questions: "Reading that and working out what to ask", rank: "Weighing every destination against your answers", photo: "Looking at your photo", "": "" }[busy];

  return (
    <section className="section wrap" id="match" aria-labelledby="match-title">
      <div className="section-head">
        <h2 id="match-title">
          Not sure where? Tell us. <span className="ai-tag">AI</span>
        </h2>
        <p>
          Write it the way you&rsquo;d tell a friend. LUXE asks the two or three questions that matter for your trip, then ranks
          every destination against your answers. Or show it a photo of the feeling you&rsquo;re after.
        </p>
      </div>
      <div className="panel">
        <label className="label" htmlFor="mm-text">Your trip, in a sentence</label>
        <textarea
          id="mm-text"
          className="field"
          style={{ marginTop: 8 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={600}
          placeholder="Ten-year anniversary in the spring. We hate crowds, love food, and my wife doesn't do long hikes."
        />
        <div className="qrow" style={{ marginTop: 12, alignItems: "center" }}>
          <button className="btn solid" onClick={ask} disabled={!!busy || enabled === null}>
            Ask me the right questions
          </button>
          <button className="btn" onClick={() => file.current?.click()} disabled={!!busy || enabled === null}>
            Match a photo instead
          </button>
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) photo(f);
            }}
          />
          {busy ? (
            <button className="btn" onClick={() => ctl.current?.abort()}>
              Stop
            </button>
          ) : null}
        </div>
        {busy ? <p className="thinking" style={{ marginTop: 16 }}>{waiting}</p> : null}
        {error ? <p className="notice bad" style={{ marginTop: 16 }}>{error}</p> : null}

        {qs.length && !busy ? (
          <div>
            {qs.map((q, i) => (
              <fieldset className="mq" key={q.q}>
                <legend>{q.q}</legend>
                <div className="chips" style={{ flexWrap: "wrap" }}>
                  {q.options.map((o, k) => (
                    <button
                      key={o}
                      className="chip"
                      aria-pressed={answers[i] === k}
                      onClick={() =>
                        setAnswers((a) => {
                          const n = { ...a };
                          if (n[i] === k) delete n[i];
                          else n[i] = k;
                          return n;
                        })
                      }
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            <div className="qrow" style={{ marginTop: 20, alignItems: "center" }}>
              <button className="btn solid" onClick={rank}>
                Rank my places
              </button>
              <span className="ai-note">Skip any question you like.</span>
            </div>
          </div>
        ) : null}

        {picks.length && !busy ? (
          <div className="picks" aria-live="polite">
            {picks.map((p, i) => {
              const c = bySlug.get(p.slug);
              if (!c) return null;
              const on = saved.includes(p.slug);
              return (
                <article key={p.slug} className={`pick${i === 0 ? " top" : ""}`}>
                  <Photo photo={c.photo} sizes="(max-width: 640px) 100vw, 33vw" ratio={16 / 9} credit={false} />
                  <div className="pick-body">
                    <div className="pick-head">
                      <h3>{c.name}</h3>
                      <span className="num">{p.fit}% fit</span>
                    </div>
                    <div className="fit">
                      <i style={{ width: `${p.fit}%` }} />
                    </div>
                    <p>{p.why}</p>
                    {p.watchOut ? (
                      <p className="watch">
                        <b>Watch out:</b> {p.watchOut}
                      </p>
                    ) : null}
                    {p.bestMonth ? <p className="ai-note">Go in {p.bestMonth}</p> : null}
                    <div className="qrow">
                      <Link className="btn sm" href={`/destinations/${p.slug}`}>
                        See {c.name}
                      </Link>
                      <button
                        className="btn sm"
                        onClick={() => {
                          if (!on) {
                            toggleSaved(p.slug);
                            toast(`${c.name} saved.`);
                          }
                        }}
                      >
                        {on ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
