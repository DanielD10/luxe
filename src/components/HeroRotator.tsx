"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { CardData } from "@/lib/cards";
import { photoPage, photoSrcSet, photoUrl } from "@/lib/photos";

/** Full-bleed rotating hero. The first slide loads eagerly for a fast first paint. */
export default function HeroRotator({ slides, children, intro }: { slides: CardData[]; children: ReactNode; intro: ReactNode }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const cur = slides[i];
  return (
    <section className="hero" aria-label="Featured destinations">
      {slides.map((s, k) => (
        <div key={s.slug} className={`slide${k === i ? " on" : ""}`} aria-hidden={k !== i}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl(s.photo, 1680)}
            srcSet={photoSrcSet(s.photo, [720, 1080, 1680, 2400])}
            sizes="100vw"
            alt={k === i ? s.photo.alt : ""}
            loading={k === 0 ? "eager" : "lazy"}
            fetchPriority={k === 0 ? "high" : "low"}
          />
        </div>
      ))}
      <div className="hero-body">
        <div className="wrap">
          {children}
          <div className="hero-row">
            {intro}
            <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              <Link className="hero-cap" href={`/destinations/${cur.slug}`}>
                <b>{cur.name}</b>
                {cur.country.toUpperCase()}
              </Link>
              <div className="dots" role="group" aria-label="Featured places">
                {slides.map((s, k) => (
                  <button key={s.slug} aria-label={`Show ${s.name}`} aria-current={k === i} onClick={() => setI(k)} />
                ))}
              </div>
              <a className="credit" style={{ position: "static", display: "block", textAlign: "right", marginTop: 8 }} href={photoPage(cur.photo)} target="_blank" rel="noopener noreferrer">
                Photo: {cur.photo.by} / Unsplash
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
