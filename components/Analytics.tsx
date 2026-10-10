'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'

// Google Analytics 4 with Consent Mode v2. Consent defaults to DENIED — no analytics
// cookies are set until the visitor accepts in the banner. gtag.js still loads for
// everyone and, without consent, sends cookieless pings (disclosed in the privacy
// policy, section 5). Google signals and ad personalisation are off.
// GA only ever receives the page path: automatic page views are off and every
// page_view is sent by hand with the query string and fragment stripped, so search
// terms (/#q=…) and anything else in the URL never reach Google. Tool inputs are
// never part of the URL in the first place (see test/privacy/static-guard.test.ts).
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-XXW3FWR6BY'

type Gtag = (...args: unknown[]) => void

/** The only page data GA receives: origin + path, title, and the referrer's origin. */
export function sanitisedPageView() {
  const { origin, pathname } = window.location
  let referrer = ''
  try {
    referrer = document.referrer ? new URL(document.referrer).origin : ''
  } catch {
    referrer = ''
  }
  return {
    page_location: origin + pathname,
    page_path: pathname,
    page_title: document.title,
    page_referrer: referrer,
  }
}

const GA_INIT = `
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
          // No automatic page views: Analytics.tsx sends sanitised ones (path only).
          // page_location/page_referrer are pinned here too, so every event gtag.js
          // sends by itself (engagement, scroll, enhanced measurement) carries the
          // path only — never the query string or #fragment.
          var ref = '';
          try { ref = document.referrer ? new URL(document.referrer).origin : ''; } catch (e) {}
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            send_page_view: false,
            page_location: location.origin + location.pathname,
            page_referrer: ref,
          });
        `

export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag
    if (typeof gtag !== 'function') return
    const pv = sanitisedPageView()
    // Keep the pinned location current after client-side navigation.
    gtag('set', { page_location: pv.page_location, page_referrer: pv.page_referrer })
    gtag('event', 'page_view', pv)
  }, [pathname])

  if (!GA_ID) return null
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* Plain inline script: runs while the HTML is parsed, before hydration, so
          consent defaults and gtag exist before the first sanitised page_view. */}
      <script id="ga-consent-init" dangerouslySetInnerHTML={{ __html: GA_INIT }} />
    </>
  )
}
