import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from 'next/font/google'
import ConsentBanner from '@/components/ConsentBanner'
import Analytics from '@/components/Analytics'
import './globals.css'

const SITE = 'https://dauntexlabs.com'

// Self-hosted at build time — no runtime request to Google. Exposed as CSS vars
// consumed by --font-display / --font-sans / --font-mono in globals.css.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--ff-display',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--ff-sans',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--ff-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
})

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'dauntexlabs — 100+ free, on-device tools',
    template: '%s — dauntexlabs',
  },
  description:
    '100+ free online tools designed to run in your browser — developer utilities, converters, generators, formatters and calculators for marketing, finance, education and everyday tasks. No sign-up.',
  applicationName: 'dauntexlabs',
  keywords: [
    'free online tools',
    'developer tools',
    'client-side tools',
    'converters',
    'generators',
    'calculators',
    'seo tools',
    'marketing tools',
    'json',
    'base64',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'dauntexlabs',
    title: 'dauntexlabs — 100+ free, on-device tools',
    description:
      '100+ free tools designed to run in your browser — for developers, marketers, students and everyday tasks. No sign-up.',
    url: SITE,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'dauntexlabs — 100+ free, on-device tools',
    description:
      '100+ free tools designed to run in your browser. No sign-up.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  )
}
