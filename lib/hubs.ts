import type { Category } from '@/lib/tools'

// Category hub pages (/category/<slug>/): an indexable landing page that ties a
// niche cluster of tools together. Only clusters we are building out get one.

export interface Hub {
  slug: 'india' | 'aviation'
  category: Category
  title: string
  description: string
  intro: string[]
  faq: { q: string; a: string }[]
}

export const HUBS: Hub[] = [
  {
    slug: 'india',
    category: 'India',
    title: 'Free tools for India',
    description:
      'Free browser tools for Indian paperwork and languages: GSTIN and Aadhaar checks, UPI QR codes, amounts in words in lakh and crore, and Kruti Dev to Unicode.',
    intro: [
      'Everyday work in India comes with its own formats. Invoices need the amount written in words using lakh and crore. Government offices still share documents typed in legacy Hindi fonts such as Kruti Dev and Chanakya. Shops collect payments through UPI QR codes. Businesses quote GST numbers that should be checked before an invoice goes out.',
      'This page collects the tools on dauntexlabs built for these jobs. You can convert legacy Hindi and Marathi text to Unicode so it can be searched and pasted anywhere. You can type Hindi on an English keyboard using the Remington (Gail) or InScript layout. You can make a free UPI payment QR code with your own colours and logo. You can check that a GSTIN or Aadhaar number has the right format and check digit, mask an Aadhaar card photo before sharing it, and add a name and date strip to an exam photo.',
      'Every tool is free, needs no sign-up and is designed to run in your browser, so the numbers and documents you work with are processed on your device. The format checkers only confirm that a number is well formed. They cannot tell you whether it was issued or is still active, so use the official portals for that.',
    ],
    faq: [
      {
        q: 'Can these tools tell me whether a GSTIN or Aadhaar number is real?',
        a: 'No. They check the format and the check digit, which catches most typing mistakes. Whether a number was issued, and to whom, can only be confirmed on the official GST or UIDAI portals.',
      },
      {
        q: 'Which legacy Hindi fonts can I convert to Unicode?',
        a: 'Kruti Dev, DevLys and Chanakya text can be converted to Unicode Devanagari. Other fonts are added only after their character maps have been checked against several independent sources.',
      },
      {
        q: 'Is the UPI QR code free to use for my shop?',
        a: 'Yes. The QR code is static: it contains your UPI ID and optional amount directly, so it does not expire, has no watermark and scans without going through our servers.',
      },
      {
        q: 'Do I need to install anything?',
        a: 'No. Every tool runs in a modern web browser on a phone or computer. Nothing needs to be installed and there is no account to create.',
      },
    ],
  },
  {
    slug: 'aviation',
    category: 'Aviation',
    title: 'Free aviation calculators and decoders',
    description:
      'Free flight-planning tools for pilots and students: density and pressure altitude, wind correction, crosswind, true airspeed, METAR and TAF decoders, fuel and weight & balance.',
    intro: [
      'Student pilots and private pilots do the same handful of calculations again and again: density altitude before a hot-day departure, wind correction angle for each leg, the crosswind on the runway in use, and fuel and weight and balance before every flight. Weather reports arrive as coded METAR and TAF text that takes practice to read quickly.',
      'This page collects the aviation tools on dauntexlabs. The calculators use the standard formulas taught for the written exams and show their working, so you can check them against your E6B or flight computer. The METAR and TAF decoders turn a pasted report into plain English and work out the flight category. Weight and balance and fuel planning use the numbers you enter from your own aircraft documents, because every aircraft is different.',
      'All tools are free, need no sign-up and are designed to run in your browser. They are meant for training and planning only. Always use your aircraft flight manual, official weather briefings and your instructor’s guidance for real flights.',
    ],
    faq: [
      {
        q: 'Can I use these calculators for real flight planning?',
        a: 'Use them for training and as a cross-check. For an actual flight, rely on your aircraft flight manual or POH, official weather sources and approved planning tools.',
      },
      {
        q: 'Does the METAR decoder fetch live weather?',
        a: 'No. You paste a METAR or TAF from your briefing source and the decoder explains it. The page does not fetch weather itself.',
      },
      {
        q: 'Which formulas do the calculators use?',
        a: 'They use the standard ISA atmosphere and the formulas taught in pilot ground school, such as the wind triangle for wind correction and the temperature–dew point spread for cloud base. Each tool page explains its method.',
      },
    ],
  },
]

export function hubForCategory(c: Category): Hub | undefined {
  return HUBS.find((h) => h.category === c)
}

export const hubHref = (h: Hub) => `/category/${h.slug}/`

/** Where a category link should go: its hub page if it has one, else the homepage filter. */
export function categoryHref(c: Category): string {
  const hub = hubForCategory(c)
  return hub ? hubHref(hub) : `/?cat=${encodeURIComponent(c)}`
}
