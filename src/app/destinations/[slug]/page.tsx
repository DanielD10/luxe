import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import PriceCheck from "@/components/PriceCheck";
import AskPlace from "@/components/AskPlace";
import { MonthStrip, SaveButton, TripFacts } from "@/components/DestinationParts";
import DestinationCard from "@/components/DestinationCard";
import { BAND_LABEL, bestMonths, destinations, getDestination, monthRanges } from "@/lib/destinations";
import { countries, STATE_DEPT_URL } from "@/lib/countries";
import { toCard } from "@/lib/cards";
import { photoUrl, photoPage } from "@/lib/photos";
import PhotoImg from "@/components/PhotoImg";
import { site, toursUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) return { title: "Not found" };
  const title = `${d.name}, ${d.country}`;
  const description = `${d.tagline} ${d.summary} Best months: ${monthRanges(bestMonths(d))}.`;
  return {
    title,
    description,
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: {
      title: `${title} · ${site.name}`,
      description,
      url: `/destinations/${d.slug}`,
      images: [{ url: photoUrl(d.photos[0], 1200, { h: 630 }), width: 1200, height: 630, alt: d.photos[0].alt }],
    },
  };
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) notFound();
  const c = countries[d.countryKey];
  const [hero, ...rest] = d.photos;
  const related = destinations
    .filter((x) => x.slug !== d.slug && (x.region === d.region || x.feelings.some((f) => d.feelings.includes(f))))
    .map((x) => ({ x, score: (x.region === d.region ? 1 : 0) + x.feelings.filter((f) => d.feelings.includes(f)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ x }) => toCard(x));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: d.name,
    description: d.summary,
    url: `${site.url}/destinations/${d.slug}`,
    image: d.photos.map((p) => photoUrl(p, 1600)),
    containedInPlace: { "@type": "Country", name: d.country },
    touristType: d.feelings,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="d-hero">
        <PhotoImg
          src={photoUrl(hero, 1680)}
          srcSet={[720, 1080, 1680, 2400].map((w) => `${photoUrl(hero, w)} ${w}w`).join(", ")}
          sizes="100vw"
          alt={hero.alt}
          fetchPriority="high"
        />
        <a className="credit" style={{ zIndex: 3 }} href={photoPage(hero)} target="_blank" rel="noopener noreferrer">
          Photo: {hero.by} / Unsplash
        </a>
        <div className="d-hero-body">
          <div className="wrap">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/destinations">Destinations</Link> / <Link href={`/destinations?region=${encodeURIComponent(d.region)}`}>{d.region}</Link> / {d.country}
            </nav>
            <h1>{d.name}</h1>
            <p className="tag">{d.tagline}</p>
            <div className="d-actions">
              <Link className="btn solid lg" href={`/plan?d=${d.slug}`}>
                Plan this trip
              </Link>
              <SaveButton slug={d.slug} name={d.name} />
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <dl className="facts">
          <div>
            <dt>Best months</dt>
            <dd>{monthRanges(bestMonths(d))}</dd>
          </div>
          <TripFacts d={d} />
          <div>
            <dt>Luxury room</dt>
            <dd>
              {BAND_LABEL[d.band]}
              <small>per night, typical</small>
            </dd>
          </div>
          <div>
            <dt>Ideal stay</dt>
            <dd>
              {d.nights} nights
              <small>{d.country}</small>
            </dd>
          </div>
        </dl>

        <section className="section two" style={{ paddingTop: 56 }}>
          <div>
            <p className="lede">{d.summary}</p>
            <h2 style={{ fontSize: "1.8rem", margin: "36px 0 14px" }}>Don&rsquo;t miss</h2>
            <ul className="list">
              {d.highlights.map((h, i) => (
                <li key={h}>
                  <span>0{i + 1}</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 14 }}>
              <a className="muted" href={toursUrl(d.toursQuery ?? d.name)} target="_blank" rel="noopener noreferrer sponsored" style={{ fontSize: "0.9rem" }}>
                Browse tours and experiences in {d.name} ↗
              </a>
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: "1.8rem", marginBottom: 14 }}>When to go</h2>
            <MonthStrip d={d} />
          </div>
        </section>

        {rest.length ? (
          <section className="section" style={{ paddingTop: 56 }} aria-label={`More photos of ${d.name}`}>
            <div className={`gallery${rest.length === 1 ? " one" : ""}`}>
              {rest.map((p) => (
                <Photo key={p.id} photo={p} sizes="(max-width: 640px) 100vw, 50vw" />
              ))}
            </div>
          </section>
        ) : null}

        <section className="section" aria-labelledby="stay-title">
          <div className="section-head">
            <h2 id="stay-title">Where to stay</h2>
            <p>Our favorite hotels here. Ask for any of them, or tell us what you like and we&rsquo;ll match you.</p>
          </div>
          <div className="stays">
            {d.stays.map((s) => (
              <article className="stay" key={s.name}>
                <span className="area">{s.area}</span>
                <h3>{s.name}</h3>
                <p>{s.note}</p>
                <Link className="btn sm" href={`/plan?d=${d.slug}&stay=${encodeURIComponent(s.name)}`}>
                  Request this stay
                </Link>
              </article>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <PriceCheck slug={d.slug} name={d.name} stays={d.stays} nights={d.nights} />
          </div>
        </section>

        <section className="section two" aria-label="Practical details">
          <div className="panel">
            <h3>Before you go</h3>
            <dl className="kv">
              <div>
                <dt>Getting there</dt>
                <dd>
                  Fly into {d.gateway.code}. {d.gateway.lastLegNote}, about {d.gateway.lastLeg < 1 ? `${Math.round(d.gateway.lastLeg * 60)} minutes` : `${d.gateway.lastLeg} hours`}.
                </dd>
              </div>
              <div>
                <dt>US passport</dt>
                <dd>
                  {c.entry}{" "}
                  <a href={STATE_DEPT_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--sand)" }}>
                    State Department country info ↗
                  </a>
                </dd>
              </div>
              <div>
                <dt>Money</dt>
                <dd>{c.currency}</dd>
              </div>
              <div>
                <dt>Plugs</dt>
                <dd>{c.plugs}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{c.language}</dd>
              </div>
            </dl>
            <p className="ai-note" style={{ marginTop: 12 }}>Entry rules change. Your advisor confirms them for your passport before you book.</p>
          </div>
          <AskPlace slug={d.slug} name={d.name} />
        </section>

        <section className="section" aria-labelledby="rel-title">
          <div className="section-head">
            <h2 id="rel-title">If you like {d.name}</h2>
            <p>Similar feeling, similar part of the world.</p>
          </div>
          <div className="grid">
            {related.map((r) => (
              <DestinationCard key={r.slug} d={r} month={-1} />
            ))}
          </div>
        </section>

        <section className="cta-band">
          <h2>Ready for {d.name}?</h2>
          <p>Tell us your dates. You&rsquo;ll get an all-in quote with perks within one business day.</p>
          <Link className="btn solid lg" href={`/plan?d=${d.slug}`}>
            Plan this trip
          </Link>
        </section>
      </div>
    </>
  );
}
