"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CardData } from "@/lib/cards";
import { BUDGETS, INTERESTS, OCCASIONS, validateInquiry, type InquiryErrors } from "@/lib/inquiry";
import { MONTHS_LONG } from "@/lib/destinations";
import { AiCallError, callAi, useAiEnabled } from "@/lib/client/ai";
import { useOrigin, useSaved } from "@/lib/client/store";
import { ORIGINS } from "@/lib/travel";

type Day = { title: string; morning: string; afternoon: string; evening: string; pace: string };
type Plan = { summary: string; stay: string; days: Day[]; tips: string[]; nights: number };

function planText(p: Plan, place: string): string {
  return [
    `${place}, ${p.nights} nights${p.stay ? ` · ${p.stay}` : ""}`,
    p.summary,
    ...p.days.map((d, i) => `Day ${i + 1}: ${d.title}\n  Morning: ${d.morning}\n  Afternoon: ${d.afternoon}\n  Evening: ${d.evening}`),
    ...(p.tips.length ? ["Tips: " + p.tips.join(" · ")] : []),
  ].join("\n");
}

/**
 * The request funnel: optional AI day-by-day draft, then the trip
 * request that reaches an advisor. Prefilled from ?d=slug and from the
 * visitor's saved places.
 */
export default function PlanForm({ cards }: { cards: CardData[] }) {
  const saved = useSaved();
  const homeAirport = useOrigin();
  const ai = useAiEnabled();
  const bySlug = new Map(cards.map((c) => [c.slug, c]));

  const [places, setPlaces] = useState<string[]>([]);
  const [when, setWhen] = useState("");
  const [nights, setNights] = useState(7);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budget, setBudget] = useState<string>("Not sure yet");
  const [interests, setInterests] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string>("Just because");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [origin, setOriginLocal] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState("");

  // AI draft
  const [draftFor, setDraftFor] = useState("");
  const [draftAbout, setDraftAbout] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planBusy, setPlanBusy] = useState(false);
  const [planError, setPlanError] = useState("");
  const ctl = useRef<AbortController | null>(null);

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    const start = [d, ...saved].filter((s): s is string => !!s && bySlug.has(s));
    const uniq = [...new Set(start)].slice(0, 6);
    setPlaces(uniq);
    setDraftFor(uniq[0] ?? "");
    if (d && bySlug.has(d)) setNights(bySlug.get(d)!.nights);
    const stay = params.get("stay");
    if (stay) setNotes(`Interested in ${stay}.`);
    setOriginLocal(homeAirport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (list: string[], v: string, set: (x: string[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function draft() {
    if (!draftFor) {
      setPlanError("Pick a place to draft first.");
      return;
    }
    setPlanBusy(true);
    setPlanError("");
    setPlan(null);
    ctl.current = new AbortController();
    const monthIdx = MONTHS_LONG.findIndex((m) => when.toLowerCase().includes(m.toLowerCase().slice(0, 3)));
    try {
      const p = await callAi<Plan>(
        {
          task: "itinerary",
          slug: draftFor,
          nights,
          travelers: adults + children,
          month: monthIdx >= 0 ? monthIdx : null,
          interests: [draftAbout, interests.join(", "), occasion !== "Just because" ? occasion : ""].filter(Boolean).join(". "),
          origin: origin || homeAirport,
        },
        ctl.current.signal,
      );
      setPlan(p);
    } catch (e) {
      const err = e as AiCallError;
      if (err.code !== "cancelled") setPlanError(err.message);
    } finally {
      setPlanBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      destinations: places,
      when,
      nights,
      adults,
      children,
      budget,
      interests,
      occasion,
      name,
      email,
      phone,
      notes,
      origin,
      itinerary: plan ? planText(plan, bySlug.get(draftFor)?.name ?? draftFor) : "",
      consent,
      company,
    };
    const v = validateInquiry(body);
    setErrors(v.errors);
    if (!v.ok) {
      const first = Object.keys(v.errors)[0];
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    setServerError("");
    try {
      const r = await fetch("/api/inquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d.errors) setErrors(d.errors);
        throw new Error(d.error || "Something went wrong. Try again.");
      }
      setStatus("sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      setServerError((err as Error).message);
    }
  }

  if (status === "sent") {
    return (
      <div className="panel" role="status">
        <h2 style={{ fontSize: "2.2rem", marginBottom: 12 }}>Request received.</h2>
        <p className="muted" style={{ maxWidth: "56ch" }}>
          An advisor will reply to {email} within one business day with live availability, an all-in price and the perks that come with
          booking through LUXE. Nothing is booked or charged until you say yes.
        </p>
        <div className="qrow" style={{ marginTop: 20 }}>
          <Link className="btn" href="/destinations">Keep browsing</Link>
          <Link className="btn" href="/saved">Your saved places</Link>
        </div>
      </div>
    );
  }

  const err = (k: keyof InquiryErrors) =>
    errors[k] ? (
      <span className="err" id={`e-${k}`}>
        {errors[k]}
      </span>
    ) : null;

  return (
    <form onSubmit={submit} noValidate>
      <div className="panel">
        <h3>Where</h3>
        <p className="muted" style={{ marginBottom: 12, fontSize: "0.92rem" }}>Pick up to six. Your saved places are already in.</p>
        <div className="chips" style={{ flexWrap: "wrap" }}>
          {places.map((s) => (
            <button type="button" key={s} className="chip" aria-pressed="true" onClick={() => setPlaces(places.filter((x) => x !== s))}>
              {bySlug.get(s)?.name} ✕
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="f-destinations">Add a place</label>
        <select
          id="f-destinations"
          className="field"
          style={{ marginTop: 12, maxWidth: 420 }}
          value=""
          aria-invalid={!!errors.destinations}
          onChange={(e) => {
            const v = e.target.value;
            if (v && !places.includes(v) && places.length < 6) {
              setPlaces([...places, v]);
              if (!draftFor) setDraftFor(v);
            }
          }}
        >
          <option value="">+ Add a place</option>
          {cards
            .filter((c) => !places.includes(c.slug))
            .map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}, {c.country}</option>
            ))}
        </select>
        {err("destinations")}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>When and who</h3>
        <div className="form-grid">
          <label>
            When
            <input id="f-when" className="field" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="e.g. late April, or 12–19 Oct" maxLength={80} aria-invalid={!!errors.when} />
            {err("when")}
          </label>
          <label>
            Nights
            <input id="f-nights" className="field" type="number" min={1} max={60} value={nights} onChange={(e) => setNights(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} />
          </label>
          <label>
            Adults
            <input className="field" type="number" min={1} max={20} value={adults} onChange={(e) => setAdults(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
          </label>
          <label>
            Children
            <input className="field" type="number" min={0} max={10} value={children} onChange={(e) => setChildren(Math.max(0, Math.min(10, Number(e.target.value) || 0)))} />
          </label>
          <label>
            Budget for the room
            <select className="field" value={budget} onChange={(e) => setBudget(e.target.value)}>
              {BUDGETS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            Occasion
            <select className="field" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              {OCCASIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            Flying from
            <select className="field" value={origin} onChange={(e) => setOriginLocal(e.target.value)}>
              {ORIGINS.map((o) => (
                <option key={o.code} value={o.code}>{o.city} ({o.code})</option>
              ))}
              <option value="">Somewhere else</option>
            </select>
          </label>
          <div className="full">
            <span style={{ fontSize: "0.86rem", color: "var(--ivory-2)" }}>What matters to you</span>
            <div className="chips" style={{ flexWrap: "wrap", marginTop: 8 }}>
              {INTERESTS.map((i) => (
                <button type="button" key={i} className="chip" aria-pressed={interests.includes(i)} onClick={() => toggle(interests, i, setInterests)}>
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {ai ? (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3>
            Draft the days <span className="ai-tag">AI</span>
          </h3>
          <p className="muted" style={{ marginBottom: 14, fontSize: "0.92rem" }}>
            Optional. Get a day-by-day draft now; it goes to your advisor with the request, who turns it into the real plan.
          </p>
          <div className="form-grid">
            <label>
              Draft for
              <select className="field" value={draftFor} onChange={(e) => setDraftFor(e.target.value)}>
                <option value="">Pick a place</option>
                {cards.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Anything we should know
              <input className="field" value={draftAbout} onChange={(e) => setDraftAbout(e.target.value)} placeholder="First time at altitude, love photography, one spa day" maxLength={400} />
            </label>
          </div>
          <div className="qrow" style={{ marginTop: 14 }}>
            {planBusy ? (
              <button type="button" className="btn" onClick={() => ctl.current?.abort()}>Stop</button>
            ) : (
              <button type="button" className="btn solid" onClick={draft}>
                {plan ? "Draft again" : "Draft my days"}
              </button>
            )}
          </div>
          {planBusy ? <p className="thinking" style={{ marginTop: 14 }}>Drafting your days. This can take up to a minute</p> : null}
          {planError ? <p className="notice bad" style={{ marginTop: 14 }}>{planError}</p> : null}
          {plan ? (
            <div style={{ marginTop: 20 }}>
              <p className="lede" style={{ fontSize: "1.15rem", marginBottom: 6 }}>{plan.summary}</p>
              {plan.stay ? <p className="muted" style={{ marginBottom: 14 }}>Suggested stay: {plan.stay}</p> : null}
              <ol className="days">
                {plan.days.map((d, i) => (
                  <li key={i}>
                    <span className="dn">DAY {i + 1}</span>
                    <div>
                      <h3>
                        {d.title}
                        <span className={`pace ${d.pace}`}>{d.pace}</span>
                      </h3>
                      <p><b>Morning</b>{d.morning}</p>
                      <p><b>Afternoon</b>{d.afternoon}</p>
                      <p><b>Evening</b>{d.evening}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {plan.tips.length ? <p className="ai-note" style={{ marginTop: 12 }}>Tips: {plan.tips.join(" · ")}</p> : null}
              <p className="ai-note" style={{ marginTop: 8 }}>An AI draft. Your advisor checks every day against real opening times and drive times.</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Your details</h3>
        <div className="form-grid">
          <label>
            Name
            <input id="f-name" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} aria-invalid={!!errors.name} />
            {err("name")}
          </label>
          <label>
            Email
            <input id="f-email" className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={120} aria-invalid={!!errors.email} />
            {err("email")}
          </label>
          <label>
            Phone <span className="muted">(optional)</span>
            <input id="f-phone" className="field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={40} aria-invalid={!!errors.phone} />
            {err("phone")}
          </label>
          <label className="full">
            Anything else
            <textarea id="f-notes" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="Dietary needs, mobility, a celebration, rooms you've loved before…" />
          </label>
          <label className="sr-only" aria-hidden="true">
            Company
            <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
          <div className="full">
            <label className="check" htmlFor="f-consent">
              <input id="f-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={!!errors.consent} />
              <span>
                You can contact me about this trip by email{phone ? " or phone" : ""}. See our <Link href="/privacy" style={{ color: "var(--sand)" }}>privacy policy</Link>.
              </span>
            </label>
            {err("consent")}
          </div>
        </div>
        {serverError ? <p className="notice bad" style={{ marginTop: 16 }}>{serverError}</p> : null}
        <div className="qrow" style={{ marginTop: 20, alignItems: "center" }}>
          <button className="btn solid lg" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send my trip request"}
          </button>
          <span className="ai-note">Free. No booking fee. Nothing is charged until you approve a quote.</span>
        </div>
      </div>
    </form>
  );
}
