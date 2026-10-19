import type { Metadata } from "next";
import { Suspense } from "react";
import Browser from "@/components/Browser";
import { cards } from "@/lib/cards";

export const metadata: Metadata = {
  title: "Destinations",
  description: `${cards.length} luxury destinations across Europe, Asia, Africa, the Americas and Oceania, with seasons, travel times from your airport and typical prices.`,
  alternates: { canonical: "/destinations" },
};

export default function DestinationsPage() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">All destinations</p>
        <h1>Where to next.</h1>
        <p>
          {cards.length} places, from overwater villas to desert lodges. Filter by month to see what&rsquo;s in season, and set your home
          airport to see the real trip length.
        </p>
      </header>
      <Suspense>
        <Browser items={cards} />
      </Suspense>
    </div>
  );
}
