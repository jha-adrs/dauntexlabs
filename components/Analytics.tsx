'use client'

import Script from 'next/script'

// Google Analytics 4 with Consent Mode v2. Loads only if NEXT_PUBLIC_GA_ID is set
// (Cloudflare Pages → Settings → Environment variables). Consent defaults to
// DENIED — no analytics cookies are set until the visitor accepts in the banner.
// GA measures page visits only; it never receives what users type into a tool.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function Analytics() {
  if (!GA_ID) return null
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-consent-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          // Consent Mode v2 — everything denied by default (EU-safe).
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted',
          });
          // Restore a prior "accept" so returning visitors aren't re-asked.
          try {
            if (localStorage.getItem('dxl-analytics') === 'granted') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          } catch (e) {}
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  )
}
