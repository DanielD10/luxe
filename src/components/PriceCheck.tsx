"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Stay } from "@/lib/types";
import { perksValue } from "@/lib/travel";

type Result = {
  rate: null | { hotel: string; nightly: number | null; total: number | null; sources: { source: string; nightly: number }[] };
  nights: number;
  perks: number;
};

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Today's public rate for a recommended stay, next to what booking with
 * LUXE adds. When live rates are off, it explains the price promise and
 * points to a quote instead.
 */
export default function PriceCheck({ slug, name, stays, nights: defaultNights }: { slug: string; name: string; stays: Stay[]; nights: number }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [stay, setStay] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [nights, setNights] = useState(defaultNights);
  const [adults, setAdults] = useState(2);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setCheckIn(iso(new Date(Date.now() + 45 * 86_400_000)));
    fetch("/api/rates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => setEnabled(false));
  }, []);

  const quoteHref = `/plan?d=${slug}&stay=${encodeURIComponent(stays[stay]?.name ?? "")}`;

  if (enabled === false || enabled === null) {
    return (
      <div className="panel">
        <h3>Our price promise</h3>
        <p className="muted" style={{ marginBottom: 14 }}>
          You pay the same public rate you&rsquo;d find on Expedia or the hotel&rsquo;s own site, or less. On top, at no extra cost:
          breakfast for two every day, a $100 property credit, and an upgrade and late checkout when available. On a{" "}
          {defaultNights}-night stay that&rsquo;s worth about <b style={{ color: "var(--sand)" }}>{money(perksValue(defaultNights))}</b>.
        </p>
        <Link className="btn solid" href={quoteHref}>
          Get a quote for {name}
        </Link>
      </div>
    );
  }

  async function check() {
    setBusy(true);
    setError("");
    setOut(null);
    const out = new Date(new Date(checkIn + "T00:00:00Z").getTime() + nights * 86_400_000);
    try {
      const r = await fetch("/api/rates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, stay, checkIn, checkOut: iso(out), adults }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn't fetch rates right now.");
      setOut(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const nightly = out?.rate?.nightly ?? null;
  return (
    <div className="panel">
      <h3>Check today&rsquo;s public rate</h3>
      <p className="muted" style={{ marginBottom: 16 }}>
        We pull the lowest public price across Expedia, Booking.com, the hotel&rsquo;s site and others, then show what booking with LUXE adds.
      </p>
      <div className="pc-form">
        <label>
          Stay
          <select className="field" value={stay} onChange={(e) => setStay(Number(e.target.value))}>
            {stays.map((s, i) => (
              <option key={s.name} value={i}>{s.name}</option>
            ))}
          </select>
        </label>
        <label>
          Check-in
          <input className="field" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </label>
        <label>
          Nights
          <input className="field" type="number" min={1} max={30} value={nights} onChange={(e) => setNights(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} />
        </label>
        <label>
          Adults
          <input className="field" type="number" min={1} max={6} value={adults} onChange={(e) => setAdults(Math.max(1, Math.min(6, Number(e.target.value) || 1)))} />
        </label>
        <button className="btn solid" onClick={check} disabled={busy}>
          {busy ? "Checking…" : "Check rate"}
        </button>
      </div>
      {error ? <p className="notice bad" style={{ marginTop: 14 }}>{error}</p> : null}
      {out && !out.rate ? (
        <p className="notice" style={{ marginTop: 14 }}>
          No public rate found for those dates. It may be sold out or not listed online. <Link href={quoteHref} style={{ color: "var(--sand)" }}>Ask us instead</Link>, we often have access to rooms that aren&rsquo;t online.
        </p>
      ) : null}
      {out?.rate ? (
        <div className="pc-out" aria-live="polite">
          <div>
            <p className="label">Lowest public rate</p>
            <p className="big">{nightly ? money(nightly) : "—"}</p>
            <p className="muted" style={{ fontSize: "0.86rem" }}>
              per night{out.rate.total ? ` · ${money(out.rate.total)} total` : ""}
            </p>
            {out.rate.sources.length ? (
              <div className="pc-src">
                {out.rate.sources.map((s) => (
                  <div key={s.source}>
                    <span>{s.source}</span>
                    <span className="num">{money(s.nightly)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="luxe">
            <p className="label">Book with LUXE</p>
            <p className="big">{nightly ? money(nightly) : "Same"}</p>
            <p className="muted" style={{ fontSize: "0.86rem" }}>per night, or less, plus perks worth about</p>
            <p style={{ fontSize: "1.3rem", color: "var(--sand)", marginTop: 4 }} className="num">+{money(out.perks)}</p>
            <p className="muted" style={{ fontSize: "0.82rem", marginTop: 6 }}>Breakfast for two daily, $100 credit, upgrade and late checkout when available.</p>
            <Link className="btn solid" style={{ marginTop: 12 }} href={quoteHref}>
              Hold this with an advisor
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
