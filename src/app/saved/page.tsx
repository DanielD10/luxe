import type { Metadata } from "next";
import { Suspense } from "react";
import SavedBoard from "@/components/SavedBoard";
import { cards } from "@/lib/cards";
import { destinations } from "@/lib/destinations";
import { visaShort } from "@/lib/countries";

export const metadata: Metadata = {
  title: "Saved",
  description: "Your saved places, side by side, with a link to share with whoever you're traveling with.",
  alternates: { canonical: "/saved" },
  robots: { index: false },
};

export default function SavedPage() {
  const visa = Object.fromEntries(destinations.map((d) => [d.slug, visaShort(d.countryKey)]));
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">Saved</p>
        <h1>Your shortlist.</h1>
        <p>Compare travel time, seasons and price side by side, then send the list to whoever you&rsquo;re going with.</p>
      </header>
      <Suspense>
        <SavedBoard cards={cards} visa={visa} />
      </Suspense>
    </div>
  );
}
