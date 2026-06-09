'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { tools } from '@/lib/tools'

// Instrument-header bar: brand, live UTC readout, on-device seal, build tag.
export default function StatusBar() {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(utc())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="statusbar">
      <div className="shell row">
        <Link href="/" className="brand" aria-label="dauntexlabs home">
          <span className="mark">◇</span>
          <span>
            dauntex<b>labs</b>
          </span>
        </Link>

        <div className="readout">
          <span className="ro">
            <i>SYS</i> {tools.length} MODULES
          </span>
          <span className="ro clock">
            <i>UTC</i> {clock || '--:--:--'}
          </span>
          <span className="seal">
            <span className="dot" />
            on-device
          </span>
          <span className="ro tag">v0.1 // PROTOTYPE</span>
        </div>
      </div>
    </header>
  )
}

function utc(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
}
