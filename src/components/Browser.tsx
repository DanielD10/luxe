"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CardData } from "@/lib/cards";
import type { Feeling, Region } from "@/lib/types";
import { FEELINGS, MONTHS_LONG, REGIONS } from "@/lib/destinations";
import { ORIGINS, doorToDoor } from "@/lib/travel";
import { setOrigin, useOrigin } from "@/lib/client/store";
import DestinationCard from "./DestinationCard";

type Sort = "recommended" | "closest" | "price-low" | "price-high";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * The imagery-first browser: photos are the results, filters are a thin
 * bar above them. Filters sync to the URL so a filtered view can be
 * shared or bookmarked.
 */
export default function Browser({ items, limit, syncUrl = true }: { items: CardData[]; limit?: number; syncUrl?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const origin = useOrigin();

  // Every destination is in the static HTML (good for search). Filters
  // from the URL apply after load, so a shared filtered link still works.
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<Region | "">("");
  const [feel, setFeel] = useState<Feeling | "">("");
  const [month, setMonth] = useState<number>(-1);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") ?? "");
    const r = params.get("region") ?? "";
    if ((REGIONS as string[]).includes(r)) setRegion(r as Region);
    const f = params.get("feel") ?? "";
    if ((FEELINGS as string[]).includes(f)) setFeel(f as Feeling);
    const m = Number(params.get("month"));
    if (params.has("month") && Number.isInteger(m) && m >= 0 && m <= 11) setMonth(m);
    setReady(true);
  }, []);
  const [sort, setSort] = useState<Sort>("recommended");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!syncUrl || !ready) return;
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (region) sp.set("region", region);
    if (feel) sp.set("feel", feel);
    if (month >= 0) sp.set("month", String(month));
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [q, region, feel, month, syncUrl, ready, router, pathname]);

  const results = useMemo(() => {
    const nq = norm(q.trim());
    let r = items.filter(
      (d) =>
        (!region || d.region === region) &&
        (!feel || d.feelings.includes(feel)) &&
        (!nq || norm(`${d.name} ${d.country} ${d.region} ${d.tagline} ${d.feelings.join(" ")}`).includes(nq)),
    );
    const score = (d: CardData) => (month < 0 ? 0 : { "2": 0, "1": 1, "0": 2, x: 3 }[d.months[month]] ?? 2);
    const hours = (d: CardData) => doorToDoor(d, origin).hours;
    r = [...r].sort((a, b) => {
      if (sort === "closest") return hours(a) - hours(b);
      if (sort === "price-low") return a.band - b.band || score(a) - score(b);
      if (sort === "price-high") return b.band - a.band || score(a) - score(b);
      return score(a) - score(b);
    });
    return r;
  }, [items, q, region, feel, month, sort, origin]);

  const shown = limit && !showAll ? results.slice(0, limit) : results;
  const filtered = !!(q || region || feel || month >= 0);

  return (
    <div>
      <div className="filters">
        <div className="filters-row">
          <label className="sr-only" htmlFor="b-q">Search destinations</label>
          <input id="b-q" className="field" type="search" placeholder="Search a place, a country, a feeling" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          <label className="sr-only" htmlFor="b-month">Month</label>
          <select id="b-month" className="field" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            <option value={-1}>Any month</option>
            {MONTHS_LONG.map((name, i) => (
              <option key={name} value={i}>{name}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="b-region">Region</label>
          <select id="b-region" className="field" value={region} onChange={(e) => setRegion(e.target.value as Region | "")}>
            <option value="">Everywhere</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="b-origin">Flying from</label>
          <select id="b-origin" className="field" value={origin} onChange={(e) => setOrigin(e.target.value)} title="Flying from">
            {ORIGINS.map((o) => (
              <option key={o.code} value={o.code}>From {o.code} · {o.city}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="b-sort">Sort</label>
          <select id="b-sort" className="field" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="recommended">{month >= 0 ? "Best for the month" : "Recommended"}</option>
            <option value="closest">Shortest trip</option>
            <option value="price-low">Price: lower first</option>
            <option value="price-high">Price: higher first</option>
          </select>
        </div>
        <div className="chips" style={{ marginTop: 10 }} role="group" aria-label="Feeling">
          <button className="chip" aria-pressed={!feel} onClick={() => setFeel("")}>All</button>
          {FEELINGS.map((f) => (
            <button key={f} className="chip" aria-pressed={feel === f} onClick={() => setFeel(feel === f ? "" : f)}>
              {f}
            </button>
          ))}
        </div>
        <div className="result-line" aria-live="polite">
          <span>
            {results.length} of {items.length} places{month >= 0 ? ` · faded ones are closed or off-season in ${MONTHS_LONG[month]}` : ""}
          </span>
          {filtered ? (
            <button
              onClick={() => {
                setQ("");
                setRegion("");
                setFeel("");
                setMonth(-1);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {shown.length ? (
        <div className="grid">
          {shown.map((d, i) => (
            <DestinationCard key={d.slug} d={d} origin={origin} month={month} priority={i < 2 && !limit} />
          ))}
        </div>
      ) : (
        <p className="empty">Nothing matches that yet. Try a different month or feeling, or ask LUXE.</p>
      )}

      {limit && results.length > limit && !showAll ? (
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button className="btn lg" onClick={() => setShowAll(true)}>
            Show all {results.length} places
          </button>
        </div>
      ) : null}
    </div>
  );
}
