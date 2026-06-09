'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const KEY = 'dxl-consent-v1'

// First-visit acknowledgement. Stored only in this browser's localStorage —
// there is no server to send acceptance to. Renders nothing until mounted to
// avoid a flash for visitors who have already accepted (and SSR mismatch).
export default function ConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== 'accepted') setShow(true)
    } catch {
      setShow(true)
    }
  }, [])

  function accept() {
    try {
      localStorage.setItem(KEY, 'accepted')
    } catch {
      /* storage blocked — close anyway */
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="consent" role="dialog" aria-label="Privacy notice">
      <div className="shell consent-row">
        <p className="consent-text">
          <span className="consent-mark">◇</span> These tools are{' '}
          <b>designed to run on your device</b> — no accounts, no analytics, no trackers. No site
          can fully guarantee how data moves across the web, so please review the{' '}
          <Link href="/privacy/" className="consent-link">
            privacy policy
          </Link>{' '}
          (including the disclaimer) before using the tools.
        </p>
        <button className="btn btn-primary" onClick={accept}>
          accept &amp; continue
        </button>
      </div>
    </div>
  )
}
