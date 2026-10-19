import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using LUXE and booking travel through our advisors.",
  alternates: { canonical: "/terms" },
};

/*
 * DRAFT. A starting point that matches how the site works. Have a
 * lawyer review it before you take payments, and add your Seller of
 * Travel registration details where required.
 */
export default function Terms() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">Terms</p>
        <h1>Terms of use</h1>
        <p>Last updated October 19, 2026.</p>
      </header>
      <div className="prose">
        <h2>What LUXE is</h2>
        <p>
          {site.legalName} is a travel advisory. We help you choose and arrange travel, and we book it with hotels, airlines, cruise lines
          and tour operators (&ldquo;suppliers&rdquo;) on your behalf{site.hostAgency ? `, through our host agency ${site.hostAgency}` : ""}. The supplier provides the
          travel service and its own terms apply to it.
        </p>
        <h2>Information on this site</h2>
        <p>
          Destination information, seasons, door-to-door travel times and price bands are general guidance and estimates, not quotes.
          Entry requirements change; we confirm them for your passport before you book, but you&rsquo;re responsible for holding valid travel
          documents. Photos are by independent photographers via Unsplash and show the destination, not a specific room.
        </p>
        <h2>AI features</h2>
        <p>
          AI answers and draft itineraries are suggestions. They can be wrong. Nothing is booked from an AI answer; an advisor confirms
          availability, prices and details in a written quote.
        </p>
        <h2>Quotes and bookings</h2>
        <p>
          A trip request is not a booking. Your quote lists the price, what&rsquo;s included and the cancellation terms. A booking is made only
          when you approve the quote and pay as described in it. Supplier cancellation and change policies apply.
        </p>
        <h2>Our compensation</h2>
        <p>
          Suppliers pay us commissions. Some links to tour providers may earn a referral fee. These don&rsquo;t change the price you pay.
        </p>
        <h2>Liability</h2>
        <p>
          We&rsquo;re responsible for arranging your travel with reasonable care. We aren&rsquo;t responsible for the acts or omissions of
          suppliers, or for events outside our control. We strongly recommend travel insurance.
        </p>
        {site.sellerOfTravel ? (
          <>
            <h2>Registration</h2>
            <p>{site.sellerOfTravel}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
