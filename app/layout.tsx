import type { Metadata, Viewport } from 'next'
import { Chakra_Petch, IBM_Plex_Mono } from 'next/font/google'
import Backdrop from '@/components/Backdrop'
import ConsentBanner from '@/components/ConsentBanner'
import './globals.css'

const SITE = 'https://dauntexlabs.com'

// Self-hosted at build time — no runtime request to Google. Exposed as CSS vars
// consumed by --font-display / --font-mono in globals.css.
const display = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--ff-display',
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
  themeColor: '#0a0b09',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'dauntexlabs — 100+ free, on-device tools',
    template: '%s — dauntexlabs',
  },
  description:
    '100+ free online tools that run entirely in your browser — developer utilities, converters, generators, formatters and calculators for marketing, finance, education and everyday tasks. No uploads, no accounts, no telemetry.',
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
      '100+ free tools that run entirely in your browser — for developers, marketers, students and everyday tasks. No uploads, no telemetry.',
    url: SITE,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'dauntexlabs — 100+ free, on-device tools',
    description:
      '100+ free tools that run entirely in your browser. No uploads, no accounts, no telemetry.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <Backdrop />
        {children}
        <ConsentBanner />
      </body>
    </html>
  )
}
