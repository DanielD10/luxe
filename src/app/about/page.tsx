import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "LUXE is a luxury travel advisory built around imagery first, honest prices, and a real person who answers.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">About</p>
        <h1>The last tab you open.</h1>
      </header>
      <div className="prose">
        <p>
          Planning a big trip usually means a dozen tabs: booking sites with countdown timers, review sites, an advisor network that won&rsquo;t
          show a price, and a spreadsheet to add it all up. LUXE puts the good parts in one place.
        </p>
        <p>
          You find a place by looking at it. Every destination shows when to go, how long it really takes to get there from your airport,
          and what a great room typically costs. When you&rsquo;re ready, an advisor quotes one all-in price, adds the perks that come with
          booking through us, and stays with you until you&rsquo;re home.
        </p>
        <h2>What we believe</h2>
        <ul>
          <li>The first price you see should be the last one you pay.</li>
          <li>Photos should be real, and credited to the people who took them.</li>
          <li>AI is great at ideas and drafts. People should check the plans and make the bookings.</li>
          <li>A good trip needs fewer things on the schedule, not more.</li>
        </ul>
        <h2>Contact</h2>
        <p>
          {site.email ? (
            <>
              Email <a href={`mailto:${site.email}`}>{site.email}</a>
              {site.phone ? <> or call {site.phone}</> : null}. Or{" "}
            </>
          ) : null}
          <Link href="/plan">send a trip request</Link> and an advisor will reply within one business day.
        </p>
        {site.hostAgency ? <p>LUXE advisors book through {site.hostAgency}.</p> : null}
      </div>
    </div>
  );
}
