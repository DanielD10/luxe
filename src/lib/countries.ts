import type { Country } from "./types";

/**
 * Country facts for US passport holders. Entry notes are deliberately
 * short and conservative. Rules change, so every page pairs them with
 * the State Department link and a note that the advisor confirms
 * before booking. Last reviewed: October 2026.
 */

const SCHENGEN =
  "No visa for stays up to 90 days in any 180. Fingerprints and a photo are taken at the border under the EU Entry/Exit System. ETIAS, the EU's pre-travel permit, isn't running yet.";

export const STATE_DEPT_URL =
  "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages.html";

export const countries: Record<string, Country> = {
  italy: { currency: "Euro (EUR)", plugs: "C, F and L · 230 V", language: "Italian", entry: SCHENGEN },
  greece: { currency: "Euro (EUR)", plugs: "C and F · 230 V", language: "Greek", entry: SCHENGEN },
  france: { currency: "Euro (EUR)", plugs: "C and E · 230 V", language: "French", entry: SCHENGEN },
  switzerland: { currency: "Swiss franc (CHF)", plugs: "C and J · 230 V", language: "German, French, Italian", entry: SCHENGEN },
  norway: { currency: "Norwegian krone (NOK)", plugs: "C and F · 230 V", language: "Norwegian", entry: SCHENGEN },
  iceland: { currency: "Icelandic króna (ISK)", plugs: "C and F · 230 V", language: "Icelandic", entry: SCHENGEN },
  uk: {
    currency: "Pound sterling (GBP)",
    plugs: "G · 230 V",
    language: "English",
    entry: "US citizens need an Electronic Travel Authorisation (ETA) before flying. No visa for tourist stays up to six months.",
  },
  portugal: { currency: "Euro (EUR)", plugs: "C and F · 230 V", language: "Portuguese", entry: SCHENGEN },
  croatia: { currency: "Euro (EUR)", plugs: "C and F · 230 V", language: "Croatian", entry: SCHENGEN },
  spain: { currency: "Euro (EUR)", plugs: "C and F · 230 V", language: "Spanish, Catalan", entry: SCHENGEN },
  japan: {
    currency: "Japanese yen (JPY)",
    plugs: "A and B · 100 V",
    language: "Japanese",
    entry: "No visa for tourist stays up to 90 days. Visit Japan Web speeds up arrival.",
  },
  indonesia: {
    currency: "Indonesian rupiah (IDR)",
    plugs: "C and F · 230 V",
    language: "Indonesian, Balinese",
    entry: "A visa on arrival (or e-VOA online) is required, and Bali charges a tourist levy.",
  },
  maldives: {
    currency: "Rufiyaa (MVR); resorts bill in US dollars",
    plugs: "Mostly D and G · 230 V",
    language: "Dhivehi; English at resorts",
    entry: "Free 30-day visa on arrival. Submit the traveller declaration online before you fly.",
  },
  bhutan: {
    currency: "Ngultrum (BTN)",
    plugs: "D, F and G · 230 V",
    language: "Dzongkha; English widely",
    entry: "Visa required, arranged with your booking, plus a daily Sustainable Development Fee. We include both in your quote.",
  },
  india: {
    currency: "Indian rupee (INR)",
    plugs: "C, D and M · 230 V",
    language: "Hindi, Rajasthani; English widely",
    entry: "Visa required. Most travelers use India's e-Visa, applied for online before travel.",
  },
  laos: {
    currency: "Lao kip (LAK)",
    plugs: "Mixed: A, B, C, E and F · 230 V",
    language: "Lao",
    entry: "Visa required: an e-Visa online, or a visa on arrival at Luang Prabang airport.",
  },
  vietnam: {
    currency: "Vietnamese dong (VND)",
    plugs: "Mixed: A, C and D · 220 V",
    language: "Vietnamese",
    entry: "Visa required. Vietnam's e-Visa is applied for online before travel.",
  },
  srilanka: {
    currency: "Sri Lankan rupee (LKR)",
    plugs: "D, G and M · 230 V",
    language: "Sinhala, Tamil; English widely",
    entry: "An Electronic Travel Authorization (ETA) is required before arrival.",
  },
  morocco: {
    currency: "Moroccan dirham (MAD)",
    plugs: "C and E · 220 V",
    language: "Arabic, Berber, French",
    entry: "No visa for tourist stays up to 90 days.",
  },
  uae: {
    currency: "UAE dirham (AED)",
    plugs: "G · 230 V",
    language: "Arabic; English widely",
    entry: "Free visa on arrival for US citizens.",
  },
  jordan: {
    currency: "Jordanian dinar (JOD)",
    plugs: "Mixed: C, D, F, G and J · 230 V",
    language: "Arabic; English widely",
    entry: "Visa required, available on arrival. The Jordan Pass bundles the visa with Petra entry.",
  },
  tanzania: {
    currency: "Tanzanian shilling (TZS); safaris priced in US dollars",
    plugs: "D and G · 230 V",
    language: "Swahili, English",
    entry: "Visa required. Apply for Tanzania's e-Visa before travel.",
  },
  kenya: {
    currency: "Kenyan shilling (KES); safaris priced in US dollars",
    plugs: "G · 240 V",
    language: "Swahili, English",
    entry: "An Electronic Travel Authorisation (eTA) is required before travel.",
  },
  namibia: {
    currency: "Namibian dollar (NAD), pegged to the rand",
    plugs: "D and M · 220 V",
    language: "English, Afrikaans",
    entry: "Visa required since April 2025. Apply for the eVisa before you go, or pay a higher fee on arrival.",
  },
  botswana: {
    currency: "Botswana pula (BWP); safaris priced in US dollars",
    plugs: "D, G and M · 230 V",
    language: "English, Setswana",
    entry: "No visa for tourist stays up to 90 days.",
  },
  southafrica: {
    currency: "South African rand (ZAR)",
    plugs: "C, D, M and N · 230 V",
    language: "English, Afrikaans, Xhosa",
    entry: "No visa for tourist stays up to 90 days. You need two blank passport pages.",
  },
  seychelles: {
    currency: "Seychelles rupee (SCR)",
    plugs: "G · 240 V",
    language: "Seychellois Creole, English, French",
    entry: "No visa, but a Seychelles Travel Authorisation is required online before you fly.",
  },
  zanzibar: {
    currency: "Tanzanian shilling (TZS); US dollars widely used",
    plugs: "D and G · 230 V",
    language: "Swahili, English",
    entry: "Tanzania visa required (e-Visa). Zanzibar also requires its own travel insurance, bought online.",
  },
  turkey: {
    currency: "Turkish lira (TRY)",
    plugs: "C and F · 230 V",
    language: "Turkish",
    entry: "Check current rules before you book; your advisor confirms entry requirements for Turkey.",
  },
  chile: {
    currency: "Chilean peso (CLP)",
    plugs: "C and L · 220 V",
    language: "Spanish",
    entry: "No visa for stays up to 90 days.",
  },
  peru: {
    currency: "Peruvian sol (PEN)",
    plugs: "A and C · 220 V",
    language: "Spanish, Quechua",
    entry: "No visa for tourist stays up to 90 days. Machu Picchu tickets are timed and sell out.",
  },
  ecuador: {
    currency: "US dollar (USD)",
    plugs: "A and B · 120 V",
    language: "Spanish",
    entry: "No visa for tourist stays. Galápagos visitors pay a park entrance fee and need a transit control card.",
  },
  mexico: {
    currency: "Mexican peso (MXN)",
    plugs: "A and B · 127 V",
    language: "Spanish",
    entry: "No visa for tourist stays. A passport is required to fly in.",
  },
  costarica: {
    currency: "Costa Rican colón (CRC); US dollars widely used",
    plugs: "A and B · 120 V",
    language: "Spanish",
    entry: "No visa for tourist stays. You may be asked for proof of onward travel.",
  },
  usa: {
    currency: "US dollar (USD)",
    plugs: "A and B · 120 V",
    language: "English",
    entry: "Domestic for US travelers. Bring a REAL ID or passport to fly.",
  },
  canada: {
    currency: "Canadian dollar (CAD)",
    plugs: "A and B · 120 V",
    language: "English, French",
    entry: "Passport required to fly in. US citizens don't need an eTA.",
  },
  turkscaicos: {
    currency: "US dollar (USD)",
    plugs: "A and B · 120 V",
    language: "English",
    entry: "Passport required. No visa for tourist stays.",
  },
  stbarts: {
    currency: "Euro (EUR)",
    plugs: "C and E · 220 V",
    language: "French; English widely",
    entry: "Passport required. No visa for tourist stays. It's French, but not part of the Schengen area.",
  },
  colombia: {
    currency: "Colombian peso (COP)",
    plugs: "A and B · 110 V",
    language: "Spanish",
    entry: "No visa for tourist stays up to 90 days. Complete the Check-MIG form online before you fly.",
  },
  frenchpolynesia: {
    currency: "CFP franc (XPF)",
    plugs: "C and E · 220 V; many resorts also have US sockets",
    language: "French, Tahitian",
    entry: "No visa for tourist stays up to 90 days.",
  },
  newzealand: {
    currency: "New Zealand dollar (NZD)",
    plugs: "I · 230 V",
    language: "English, Māori",
    entry: "An NZeTA is required before you fly, plus a visitor levy paid with it.",
  },
  australia: {
    currency: "Australian dollar (AUD)",
    plugs: "I · 230 V",
    language: "English",
    entry: "An ETA is required before you fly, applied for in the Australian ETA app.",
  },
  fiji: {
    currency: "Fijian dollar (FJD)",
    plugs: "I · 240 V",
    language: "English, Fijian, Hindi",
    entry: "No visa for tourist stays up to four months.",
  },
};
