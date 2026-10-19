import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What LUXE collects, why, and your choices.",
  alternates: { canonical: "/privacy" },
};

/*
 * DRAFT. Written to match what this site actually does today. Have a
 * lawyer review it before launch, and update it whenever you add a
 * service (a database, a CRM, marketing email, ads pixels).
 */
export default function Privacy() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">Privacy</p>
        <h1>Privacy policy</h1>
        <p>Last updated October 19, 2026.</p>
      </header>
      <div className="prose">
        <h2>What we collect</h2>
        <p>
          <b>Trip requests.</b> When you send a request we receive what you enter: your name, email, optional phone number, travel
          details, and any notes or draft itinerary. We use it to reply, quote and book your trip.
        </p>
        <p>
          <b>Saved places and home airport.</b> These stay in your browser&rsquo;s local storage. They aren&rsquo;t sent to us unless you
          include them in a request. A share link puts the place names in the link itself.
        </p>
        <p>
          <b>AI features.</b> Questions you type into Ask LUXE, the trip matcher or the itinerary drafter, and photos you upload to match,
          are sent to our AI provider to generate an answer. Don&rsquo;t include sensitive personal information in them. We don&rsquo;t store
          them on our servers.
        </p>
        <p>
          <b>Usage analytics.</b> We use Vercel Web Analytics to count page views. It doesn&rsquo;t use cookies or track you across sites.
        </p>
        <h2>Who we share it with</h2>
        <p>
          To book your trip, we share the necessary details with the hotels, airlines and tour operators involved
          {site.hostAgency ? `, and with ${site.hostAgency}, the host agency our advisors book through` : ""}. Our service providers
          (hosting, email delivery, AI and rate lookups) process data on our behalf. We don&rsquo;t sell your personal information.
        </p>
        <h2>Your choices</h2>
        <p>
          You can ask us to access, correct or delete the information we hold about you
          {site.email ? (
            <>
              {" "}
              by emailing <a href={`mailto:${site.email}`}>{site.email}</a>
            </>
          ) : null}
          . Clearing your browser storage removes saved places.
        </p>
        <h2>Retention</h2>
        <p>We keep trip records as long as needed to provide service and meet legal and accounting obligations.</p>
      </div>
    </div>
  );
}
