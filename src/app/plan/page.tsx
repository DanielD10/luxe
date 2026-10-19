import type { Metadata } from "next";
import { Suspense } from "react";
import PlanForm from "@/components/PlanForm";
import { cards } from "@/lib/cards";

export const metadata: Metadata = {
  title: "Plan a trip",
  description: "Tell us where and when. An advisor replies within one business day with live availability, an all-in price and the perks that come with booking through LUXE.",
  alternates: { canonical: "/plan" },
};

export default function PlanPage() {
  return (
    <div className="wrap" style={{ maxWidth: 920 }}>
      <header className="page-head">
        <p className="label">Plan a trip</p>
        <h1>Tell us the trip.</h1>
        <p>
          Two minutes. An advisor replies within one business day with live availability, one all-in price and the perks that come with
          it. Nothing is booked or charged until you say yes.
        </p>
      </header>
      <Suspense>
        <PlanForm cards={cards} />
      </Suspense>
    </div>
  );
}
