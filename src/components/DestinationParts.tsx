"use client";

import { useEffect, useState } from "react";
import type { Destination } from "@/lib/types";
import { MONTHS, MONTHS_LONG, seasonOf } from "@/lib/destinations";
import { ORIGINS, doorToDoor, formatAhead, getOrigin, hoursAhead } from "@/lib/travel";
import { setOrigin, toggleSaved, toast, useOrigin, useSaved } from "@/lib/client/store";

export function SaveButton({ slug, name }: { slug: string; name: string }) {
  const saved = useSaved();
  const on = saved.includes(slug);
  return (
    <button
      className={`btn lg${on ? "" : ""}`}
      aria-pressed={on}
      onClick={() => {
        const now = toggleSaved(slug);
        toast(now ? `${name} saved. Compare it on your Saved page.` : `${name} removed.`);
      }}
    >
      {on ? "♥ Saved" : "♡ Save"}
    </button>
  );
}

/** Door to door and time difference, from the visitor's home airport. */
export function TripFacts({ d }: { d: Pick<Destination, "gateway" | "timezone"> }) {
  const origin = useOrigin();
  const o = getOrigin(origin);
  const dd = doorToDoor(d, origin);
  // Time zones depend on today's date (DST), so compute after mount to match the static HTML.
  const [ahead, setAhead] = useState<number | null>(null);
  useEffect(() => setAhead(hoursAhead(d.timezone, o.tz)), [d.timezone, o.tz]);
  return (
    <>
      <div>
        <dt>Door to door</dt>
        <dd>
          <span className="num">~{dd.hours} h</span>
          <small>
            from{" "}
            <label className="sr-only" htmlFor="tf-origin">Flying from</label>
            <select
              id="tf-origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              style={{ background: "transparent", border: 0, color: "var(--sand)", padding: 0, fontSize: "inherit" }}
            >
              {ORIGINS.map((x) => (
                <option key={x.code} value={x.code}>{x.code}</option>
              ))}
            </select>
            {dd.connections ? ` · ${dd.connections} stop${dd.connections > 1 ? "s" : ""}` : " · nonstop"}
          </small>
        </dd>
      </div>
      <div>
        <dt>Time difference</dt>
        <dd>
          <span className="num">{ahead === null ? "…" : formatAhead(ahead)}</span>
          <small>vs {o.city}, today</small>
        </dd>
      </div>
    </>
  );
}

/** Interactive season strip: tap a month to read what it's like. */
export function MonthStrip({ d }: { d: Pick<Destination, "months" | "monthNotes"> }) {
  // Starts on the first best month so the static HTML is stable, then jumps to this month.
  const [m, setM] = useState(() => Math.max(0, d.months.indexOf("2")));
  useEffect(() => setM(new Date().getMonth()), []);
  const s = seasonOf(d, m);
  const base = { best: "One of the best months to go.", good: "Good, with trade-offs.", off: "Off-season: lower rates, real downsides.", closed: "Most hotels are closed." }[s];
  return (
    <div>
      <div className="months" role="group" aria-label="Seasons by month">
        {MONTHS.map((name, i) => (
          <button key={name} className="mo" data-s={seasonOf(d, i)} aria-current={i === m} aria-label={`${MONTHS_LONG[i]}: ${seasonOf(d, i)}`} onClick={() => setM(i)}>
            <i />
            <span>{name[0]}</span>
          </button>
        ))}
      </div>
      <div className="legend">
        <span><i style={{ background: "var(--sand)" }} />Best</span>
        <span><i style={{ background: "color-mix(in srgb, var(--sand) 45%, var(--ink-3))" }} />Good</span>
        <span><i style={{ background: "var(--ink-3)", outline: "1px solid var(--line)" }} />Off-season</span>
        <span><i style={{ background: "repeating-linear-gradient(135deg, var(--ink-3) 0 3px, var(--line) 3px 5px)" }} />Closed</span>
      </div>
      <p className="month-note" aria-live="polite">
        <b>{MONTHS_LONG[m]}:</b> {d.monthNotes[m] ?? base}
      </p>
    </div>
  );
}
