"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CardData } from "@/lib/cards";
import { BAND_LABEL, bestMonths, monthRanges } from "@/lib/destinations";
import { doorToDoor, formatAhead, getOrigin, hoursAhead } from "@/lib/travel";
import { setSaved, toast, useOrigin, useSaved } from "@/lib/client/store";
import Photo from "./Photo";
import { SaveHeart } from "./DestinationCard";

/**
 * Saved places, a side-by-side comparison, and a share link. The link
 * carries the places in the URL, so a partner can open the same board
 * on their phone with no account.
 */
export default function SavedBoard({ cards, visa }: { cards: CardData[]; visa: Record<string, string> }) {
  const saved = useSaved();
  const origin = useOrigin();
  const params = useSearchParams();
  const bySlug = new Map(cards.map((c) => [c.slug, c]));
  const [shared, setShared] = useState<string[] | null>(null);
  const [aheads, setAheads] = useState<Record<string, number>>({});

  useEffect(() => {
    const p = params.get("p");
    if (p) {
      const list = p.split(",").filter((s) => bySlug.has(s)).slice(0, 20);
      if (list.length) setShared(list);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = (shared ?? saved).filter((s) => bySlug.has(s));
  const items = list.map((s) => bySlug.get(s)!);
  const o = getOrigin(origin);

  useEffect(() => {
    setAheads(Object.fromEntries(items.map((c) => [c.slug, hoursAhead(c.timezone, o.tz)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.join(","), o.tz]);

  async function share() {
    const url = `${location.origin}/saved?p=${list.join(",")}`;
    try {
      if (navigator.share) await navigator.share({ title: "Our LUXE shortlist", url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied. Send it to whoever you're traveling with.");
      }
    } catch {
      /* dismissed */
    }
  }

  if (shared) {
    const missing = shared.filter((s) => !saved.includes(s));
    return (
      <div>
        <div className="notice" style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <span>Someone shared {shared.length} place{shared.length > 1 ? "s" : ""} with you.</span>
          <span className="qrow">
            {missing.length ? (
              <button
                className="btn sm solid"
                onClick={() => {
                  setSaved([...saved, ...missing]);
                  toast("Added to your saved places.");
                  setShared(null);
                }}
              >
                Add to my saved
              </button>
            ) : null}
            <button className="btn sm" onClick={() => setShared(null)}>
              See my own
            </button>
          </span>
        </div>
        {board()}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "56px 24px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 10 }}>Nothing saved yet.</h2>
        <p className="muted" style={{ maxWidth: "48ch", margin: "0 auto 20px" }}>
          Tap the heart on any photo. Your saved places land here, side by side, with a link you can send to whoever you&rsquo;re traveling with.
        </p>
        <Link className="btn solid" href="/destinations">
          Browse destinations
        </Link>
      </div>
    );
  }

  return board();

  function board() {
    const rows = items.map((c) => ({ c, dd: doorToDoor(c, origin) }));
    const minH = Math.min(...rows.map((r) => r.dd.hours));
    return (
      <>
        <div className="qrow" style={{ marginBottom: 20, alignItems: "center" }}>
          <Link className="btn solid" href={`/plan`}>
            Request a quote for {items.length > 1 ? "these" : "this"}
          </Link>
          <button className="btn" onClick={share}>
            Share this list
          </button>
          {!shared ? (
            <button
              className="btn"
              onClick={() => {
                setSaved([]);
                toast("Cleared.");
              }}
            >
              Clear all
            </button>
          ) : null}
        </div>
        <div className="grid" style={{ marginBottom: 32 }}>
          {items.map((c) => (
            <article key={c.slug} className="card">
              <div style={{ position: "relative" }}>
                <Photo photo={c.photo} sizes="(max-width: 640px) 100vw, 25vw" ratio={4 / 5} credit={false} />
                {shared ? null : <SaveHeart slug={c.slug} name={c.name} />}
                <div className="card-over">
                  <h3>{c.name}</h3>
                  <span className="where">{c.country}</span>
                </div>
                <Link href={`/destinations/${c.slug}`} className="open" aria-label={c.name} />
              </div>
            </article>
          ))}
        </div>
        {items.length > 1 ? (
          <div className="panel">
            <h3>Side by side</h3>
            <p className="ai-note" style={{ marginBottom: 12 }}>From {o.city}. Travel times and price bands are estimates.</p>
            <div className="cmp-wrap">
              <table className="cmp">
                <thead>
                  <tr>
                    <th scope="col"><span className="sr-only">Detail</span></th>
                    {items.map((c) => (
                      <th key={c.slug} scope="col">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Door to door</td>
                    {rows.map((r) => (
                      <td key={r.c.slug} className={`num${r.dd.hours === minH ? " best" : ""}`}>~{r.dd.hours} h</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Time difference</td>
                    {items.map((c) => (
                      <td key={c.slug} className="num">{aheads[c.slug] === undefined ? "…" : formatAhead(aheads[c.slug])}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Best months</td>
                    {items.map((c) => (
                      <td key={c.slug}>{monthRanges(bestMonths(c))}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Luxury room, per night</td>
                    {items.map((c) => (
                      <td key={c.slug}>{BAND_LABEL[c.band]}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Ideal stay</td>
                    {items.map((c) => (
                      <td key={c.slug}>{c.nights} nights</td>
                    ))}
                  </tr>
                  <tr>
                    <td>US passport</td>
                    {items.map((c) => (
                      <td key={c.slug}>{visa[c.slug]}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {shared ? null : <p className="ai-note" style={{ marginTop: 16 }}>Saved in this browser. Share the link to see it on another device.</p>}
      </>
    );
  }
}
