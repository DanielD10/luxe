import Link from "next/link";
import { site } from "@/lib/site";
import { REGIONS } from "@/lib/destinations";
import { UNSPLASH_HOME } from "@/lib/photos";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link href="/" className="logo" style={{ color: "var(--ivory)" }}>
              LUXE
            </Link>
            <p style={{ marginTop: 14, maxWidth: "36ch" }}>
              Places worth the flight. Advisor-booked luxury travel with honest all-in prices and perks at no extra cost.
            </p>
            {site.email ? (
              <p style={{ marginTop: 12 }}>
                <a href={`mailto:${site.email}`}>{site.email}</a>
                {site.phone ? <> · {site.phone}</> : null}
              </p>
            ) : null}
          </div>
          <div>
            <h4>Destinations</h4>
            <ul>
              {REGIONS.map((r) => (
                <li key={r}>
                  <Link href={`/destinations?region=${encodeURIComponent(r)}`}>{r}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>LUXE</h4>
            <ul>
              <li><Link href="/how-it-works">How it works</Link></li>
              <li><Link href="/plan">Plan a trip</Link></li>
              <li><Link href="/saved">Saved</Link></li>
              <li><Link href="/about">About</Link></li>
            </ul>
          </div>
          <div>
            <h4>Fine print</h4>
            <ul>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li>
                <a href={UNSPLASH_HOME} target="_blank" rel="noopener noreferrer">
                  Photos via Unsplash
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-legal">
          <span>© {year} {site.legalName}</span>
          {site.hostAgency ? <span>LUXE advisors book through {site.hostAgency}.</span> : null}
          {site.sellerOfTravel ? <span>{site.sellerOfTravel}</span> : null}
          <span>Travel times and price bands are estimates. Entry rules change; we confirm them before you book.</span>
        </div>
      </div>
    </footer>
  );
}
