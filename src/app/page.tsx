import Link from "next/link";
import { Suspense } from "react";
import HeroRotator from "@/components/HeroRotator";
import Browser from "@/components/Browser";
import Matchmaker from "@/components/Matchmaker";
import { cards } from "@/lib/cards";
import { destinations } from "@/lib/destinations";
import { PROMISES } from "@/lib/content";
import { perksValue } from "@/lib/travel";
import { site } from "@/lib/site";

const HERO = ["maldives", "santorini", "kyoto", "patagonia", "amalfi-coast", "cape-town"];

export default function Home() {
  const slides = HERO.map((s) => cards.find((c) => c.slug === s)!).filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TravelAgency", name: site.name, url: site.url, description: site.description, ...(site.email ? { email: site.email } : {}) },
      { "@type": "WebSite", name: site.name, url: site.url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HeroRotator
        slides={slides}
        intro={
          <p>
            {destinations.length} places worth the flight, chosen and checked. One all-in price, perks worth hundreds at no extra cost, and a
            real person from first idea to flight home.
          </p>
        }
      >
        <h1>
          Places worth <em>the flight.</em>
        </h1>
        <form className="hero-search" action="/destinations" role="search">
          <label className="sr-only" htmlFor="hero-q">Search destinations</label>
          <input id="hero-q" name="q" className="field" placeholder="Where to? A place, a country, a feeling" autoComplete="off" />
          <button className="btn solid">Search</button>
        </form>
      </HeroRotator>

      <section className="section wrap" aria-labelledby="browse-title">
        <div className="section-head">
          <h2 id="browse-title">Browse with your eyes first.</h2>
          <p>
            Pick a month and the places that are closed or out of season step back. Every card shows the real trip length from your
            airport and what a luxury room typically costs.
          </p>
        </div>
        <Suspense>
          <Browser items={cards} limit={12} syncUrl={false} />
        </Suspense>
      </section>

      <Matchmaker cards={cards} />

      <section className="section wrap" aria-labelledby="perks-title">
        <div className="section-head">
          <h2 id="perks-title">Same price. More trip.</h2>
          <p>
            You pay the hotel&rsquo;s public rate or less, the same you&rsquo;d see on Expedia. Booking through LUXE adds these at partner hotels,
            worth about ${perksValue(5).toLocaleString("en-US")} on a five-night stay.
          </p>
        </div>
        <div className="perks">
          <div>
            <b>Breakfast for two</b>
            <span>Every morning of your stay</span>
          </div>
          <div>
            <b>$100 property credit</b>
            <span>For the spa, dining or the bar</span>
          </div>
          <div>
            <b>Upgrade on arrival</b>
            <span>When available</span>
          </div>
          <div>
            <b>Early in, late out</b>
            <span>When available</span>
          </div>
        </div>
        <ol className="steps" style={{ marginTop: 40 }}>
          <li>
            <span className="label">01 · Request</span>
            <b>Tell us the trip.</b>
            <p>Pick places, dates and who&rsquo;s going. Two minutes. AI can draft the days if you like.</p>
          </li>
          <li>
            <span className="label">02 · Quote</span>
            <b>Get one all-in price.</b>
            <p>Within one business day: live availability, every fee included, perks listed. Nothing charged yet.</p>
          </li>
          <li>
            <span className="label">03 · Go</span>
            <b>Book, then relax.</b>
            <p>Your reservation is in your name at the hotel, and your advisor handles changes before and during the trip.</p>
          </li>
        </ol>
      </section>

      <section className="section wrap" aria-labelledby="promise-title">
        <div className="section-head">
          <h2 id="promise-title">What we refuse to do.</h2>
          <p>We read the lawsuits, regulator reports and traveler surveys about booking sites. Every complaint that kept coming up became a rule here.</p>
        </div>
        <div className="promise">
          {PROMISES.map((p) => (
            <article key={p.title}>
              <div className="stat">
                {p.stat}
                <small>{p.statNote}</small>
              </div>
              <h3>{p.title}</h3>
              <p className="was">{p.was}</p>
              <p className="now">{p.now}</p>
              <a className="src" href={p.href} target="_blank" rel="noopener noreferrer">
                Source: {p.src} ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap">
          <h2>Where are you going next?</h2>
          <p>Tell us the trip. You&rsquo;ll have an all-in quote within one business day.</p>
          <div className="qrow" style={{ justifyContent: "center" }}>
            <Link className="btn solid lg" href="/plan">
              Plan a trip
            </Link>
            <Link className="btn lg" href="/destinations">
              See all {destinations.length} places
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
