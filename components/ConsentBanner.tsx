'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const KEY = 'dxl-consent-v1' // seen the banner
const ANALYTICS = 'dxl-analytics' // 'granted' | 'denied'

function setAnalyticsConsent(state: 'granted' | 'denied') {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void }
  w.gtag?.('consent', 'update', { analytics_storage: state })
}

// First-visit consent for privacy-conscious analytics (Google Analytics runs in
// Consent Mode, default-denied, until the visitor chooses here). Tool inputs are
// never part of this — they stay in the browser regardless of the choice.
export default function ConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== 'accepted') setShow(true)
    } catch {
      setShow(true)
    }
  }, [])

  function choose(analytics: 'granted' | 'denied') {
    try {
      localStorage.setItem(KEY, 'accepted')
      localStorage.setItem(ANALYTICS, analytics)
    } catch {
      /* storage blocked — proceed anyway */
    }
    setAnalyticsConsent(analytics)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="consent" role="dialog" aria-label="Privacy & cookies">
      <div className="shell consent-row">
        <p className="consent-text">
          <span className="consent-mark">◇</span> Your <b>tool data stays on your device</b> — what
          you type into a tool is never uploaded. We use cookies for privacy-conscious usage
          analytics (which pages are popular) to improve the site. See the{' '}
          <Link href="/privacy/" className="consent-link">
            privacy policy
          </Link>
          .
        </p>
        <div className="consent-actions">
          <button className="btn" onClick={() => choose('denied')}>
            decline
          </button>
          <button className="btn btn-primary" onClick={() => choose('granted')}>
            accept analytics
          </button>
        </div>
      </div>
    </div>
  )
}
