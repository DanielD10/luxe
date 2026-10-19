"use client";

import Link from "next/link";
import type { CardData } from "@/lib/cards";
import { BAND_LABEL, MONTHS } from "@/lib/destinations";
import { doorToDoor } from "@/lib/travel";
import { toggleSaved, toast, useOrigin, useSaved } from "@/lib/client/store";
import Photo from "./Photo";
import { HeartIcon } from "./Icons";

export function SaveHeart({ slug, name }: { slug: string; name: string }) {
  const saved = useSaved();
  const on = saved.includes(slug);
  return (
    <button
      className="heart"
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from saved` : `Save ${name}`}
      onClick={(e) => {
        e.preventDefault();
        const now = toggleSaved(slug);
        toast(now ? `${name} saved.` : `${name} removed.`);
      }}
    >
      <HeartIcon />
    </button>
  );
}

export default function DestinationCard({
  d,
  origin,
  month,
  priority,
}: {
  d: CardData;
  /** Defaults to the visitor's home airport. */
  origin?: string;
  month: number;
  priority?: boolean;
}) {
  const home = useOrigin();
  const from = origin ?? home;
  const dd = doorToDoor(d, from);
  const s = month >= 0 ? d.months[month] : null;
  const off = s === "0" || s === "x";
  return (
    <article className={`card${off ? " off" : ""}`}>
      <div style={{ position: "relative" }}>
        <Photo photo={d.photo} sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 25vw" ratio={4 / 5} priority={priority} credit={false} />
        {s === "x" ? <span className="card-tag">Closed in {MONTHS[month]}</span> : s === "0" ? <span className="card-tag">Off-season in {MONTHS[month]}</span> : s === "2" ? <span className="card-tag">Best in {MONTHS[month]}</span> : null}
        <SaveHeart slug={d.slug} name={d.name} />
        <div className="card-over">
          <h3>{d.name}</h3>
          <span className="where">{d.country}</span>
        </div>
        <Link href={`/destinations/${d.slug}`} className="open" aria-label={`${d.name}, ${d.country}`} />
      </div>
      <div className="card-meta">
        <span>
          <b className="num">~{dd.hours} h</b> from {from}
        </span>
        <span>
          <b>{BAND_LABEL[d.band]}</b> /night
        </span>
      </div>
    </article>
  );
}
