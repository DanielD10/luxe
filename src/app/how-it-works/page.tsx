import type { Metadata } from "next";
import Link from "next/link";
import { FAQ, PROMISES } from "@/lib/content";
import { perksValue } from "@/lib/travel";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it works",
  description: "How LUXE prices, books and looks after your trip: public rates or better, perks at no extra cost, and one advisor from first idea to flight home.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorks() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="page-head">
        <p className="label">How it works</p>
        <h1>Same price. More trip. A person who answers.</h1>
        <p>
          LUXE is a travel advisory. You find a place here, an advisor books it for you, and the hotel pays us a commission, so your rate is
          the public one or lower and there&rsquo;s no fee on top.
          {site.hostAgency ? ` Our advisors book through ${site.hostAgency}.` : ""}
        </p>
      </header>

      <ol className="steps">
        <li>
          <span className="label">01 · Request</span>
          <b>Tell us the trip.</b>
          <p>Choose places, dates and who&rsquo;s going. Add a draft itinerary if you like. It takes two minutes.</p>
        </li>
        <li>
          <span className="label">02 · Quote</span>
          <b>One all-in price.</b>
          <p>Within one business day: live availability, every fee included, the perks for each hotel, and our honest pick.</p>
        </li>
        <li>
          <span className="label">03 · Book and go</span>
          <b>In your name, at the hotel.</b>
          <p>You approve, we book. The reservation is yours at the property, and your advisor handles any change before or during the trip.</p>
        </li>
      </ol>

      <section className="section" aria-labelledby="money-title">
        <div className="section-head">
          <h2 id="money-title">How the money works</h2>
          <p>No hidden fees in either direction.</p>
        </div>
        <div className="two">
          <div className="prose">
            <p>
              Hotels, cruise lines and tour operators pay advisors a commission, the same way they pay booking sites. That&rsquo;s how LUXE is
              paid. Your nightly rate is the hotel&rsquo;s public rate or a better one we&rsquo;ve negotiated, never a marked-up one.
            </p>
            <p>
              Booking through an advisor at partner hotels adds perks the hotel provides: breakfast for two each day, a property credit, and
              an upgrade, early check-in and late checkout when available. On a five-night stay those are worth about $
              {perksValue(5).toLocaleString("en-US")}, valuing breakfast at $60 a day and the credit at $100.
            </p>
            <p>
              Some tour links on destination pages may earn us a referral fee from the tour company. It never changes what you pay.
            </p>
          </div>
          <div className="panel">
            <h3>Your quote always shows</h3>
            <ul className="list">
              <li><span>01</span><span>The nightly rate and the total, taxes and property fees in</span></li>
              <li><span>02</span><span>The perks for that hotel, in writing</span></li>
              <li><span>03</span><span>Cancellation terms, before you pay anything</span></li>
              <li><span>04</span><span>Entry requirements for your passport</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="promise-title">
        <div className="section-head">
          <h2 id="promise-title">What we refuse to do</h2>
          <p>The most common complaints about booking sites, and the rule we follow instead.</p>
        </div>
        <div className="promise">
          {PROMISES.map((p) => (
            <article key={p.title}>
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

      <section className="section faq" aria-labelledby="faq-title">
        <div className="section-head">
          <h2 id="faq-title">Questions</h2>
          <p />
        </div>
        {FAQ.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <section className="cta-band">
        <h2>Start with a place.</h2>
        <p>Or tell us the feeling and we&rsquo;ll find the place.</p>
        <div className="qrow" style={{ justifyContent: "center" }}>
          <Link className="btn solid lg" href="/plan">Plan a trip</Link>
          <Link className="btn lg" href="/destinations">Browse destinations</Link>
        </div>
      </section>
    </div>
  );
}
