# LUXE

Luxury travel, imagery first. Places worth the flight.

A Next.js 16 site for a travel advisory: visitors browse destinations by
photo, compare seasons and real trip lengths from their airport, save and
share a shortlist, and send a trip request that an advisor turns into an
all-in quote with perks. AI helps them explore; people book.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev                  # http://localhost:3000
```

`npm run build` is the real gate: it type-checks and validates every
destination entry (months, time zones, photos, countries). A bad entry
fails the build instead of shipping a broken page.

## Before launch

- [ ] **Trip requests**: set `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL` (on a domain verified in Resend) and `INQUIRY_TO_EMAIL`. In production the form refuses to pretend it worked without them.
- [ ] **Business details**: `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_HOST_AGENCY`.
- [ ] **Seller of Travel**: if you sell to residents of California, Florida, Washington or Hawaii, check whether you need to register, and put the number in `NEXT_PUBLIC_SELLER_OF_TRAVEL`.
- [ ] **Legal pages**: `/privacy` and `/terms` are drafts that match what the site does. Have a lawyer review them.
- [ ] **Photos**: 50 of the 113 photos are marked `named: false`. Unsplash's caption doesn't name the place, so they were picked from search results for it. Start with the 19 hero photos below (they show on cards, heroes and link previews), then the 31 gallery shots (`grep -n "false)" src/lib/destinations/*.ts`). Swap any that aren't right. A photo that fails to load shows an empty frame, not a broken image.
- [ ] **Hotels**: each destination lists real hotels as recommendations. Confirm your host agency has them as partners (for the perks) before you promote them.
- [ ] **Service promise**: the copy promises a reply within one business day. Change it in `src/lib/content.ts` and the pages if that's not realistic.
- [ ] **Domain**: add it in Vercel, then set `NEXT_PUBLIC_SITE_URL`.
- [ ] **Trademark**: "LUXE" is a common word in travel. Search USPTO before spending on branding.

Photos to eyeball (first photo not named by Unsplash): French Riviera, Zermatt, Luang Prabang, Serengeti, Masai Mara,
Sossusvlei, Okavango Delta, Seychelles, Cappadocia, Atacama, Galápagos, Tulum, Costa Rica, Napa Valley, Turks & Caicos,
St. Barts, Bora Bora, Queenstown, Fiji.

## Optional services

| Env var | What it turns on |
| --- | --- |
| `LUXE_AI_PROVIDER` + `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` | Ask LUXE chat, the trip matcher (questions, ranking, photo match), "Ask about this place", and AI itinerary drafts on /plan |
| `SERPAPI_KEY` | "Check today's public rate" on destination pages, via Google Hotels data |
| `NEXT_PUBLIC_GYG_PARTNER_ID` | Commission on "Browse tours" links |

Every optional feature hides itself when its key is missing. `GET /api/health` shows which are on.

## How it earns

1. **Hotel commissions** through your host agency (typically 10–15% of the room rate, split with the agency).
2. **Tour referrals** via GetYourGuide when `NEXT_PUBLIC_GYG_PARTNER_ID` is set.
3. Room to add: travel insurance referrals and a planning fee for complex multi-country trips.

## Where things live

- `src/lib/destinations/*.ts` — the catalog, one file per region. Add a destination by copying an entry.
- `src/lib/countries.ts` — currency, plugs, language and entry notes per country.
- `src/lib/travel.ts` — door-to-door estimates and time differences.
- `src/lib/ai/` — the AI provider and the fixed tasks. Pages never send prompts, only the traveler's words.
- `src/app/api/` — `ai`, `inquiry`, `rates`, `health`.
- Photos are Unsplash images served from its CDN and credited on each destination page.
