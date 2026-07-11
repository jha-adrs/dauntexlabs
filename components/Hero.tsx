'use client'

import { useEffect, useRef } from 'react'
import { tools, CATEGORY_ORDER } from '@/lib/tools'

interface Props {
  query: string
  setQuery: (q: string) => void
}

// Compact command band: badge + short headline + a prominent search that users
// see immediately, then a one-line trust strip. Keeps the Instrument Deck look
// but surfaces search + the tool grid near the fold.
export default function Hero({ query, setQuery }: Props) {
  const live = tools.filter((t) => t.status !== 'maintenance').length
  const rounded = Math.floor(live / 10) * 10 // 106 → 100
  const inputRef = useRef<HTMLInputElement>(null)

  // Press "/" anywhere (when not already typing) to jump to search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName ?? ''
      if (e.key === '/' && !/^(input|textarea|select)$/i.test(tag)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section className="hero">
      <span className="beam" aria-hidden />

      <div className="shell hero-inner">
        <span
          className="reveal"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--line-strong)',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--acid)',
            background: 'rgba(198, 242, 78, 0.06)',
            animationDelay: '20ms',
          }}
        >
          ◇ {rounded}+ free tools · on-device · no sign-up
        </span>

        <h1 className="reveal" style={{ animationDelay: '90ms' }}>
          Everything runs <span className="em">on your machine.</span>
        </h1>

        <p className="lede reveal" style={{ animationDelay: '150ms' }}>
          {rounded}+ free tools for developers, marketers, students and everyday tasks — every
          byte is processed locally in your browser.
        </p>

        <div className="prompt reveal" style={{ animationDelay: '210ms' }}>
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${rounded}+ tools — base64, bmi, invoice, regex…`}
            spellCheck={false}
            autoComplete="off"
            aria-label="Search tools"
          />
          {query ? (
            <button className="clear" onClick={() => setQuery('')} aria-label="Clear search">
              ✕
            </button>
          ) : (
            <span className="kbd" aria-hidden>
              /
            </span>
          )}
        </div>

        <div className="hero-trust reveal" style={{ animationDelay: '280ms' }}>
          <span>
            <span className="dot">◇</span> on-device
          </span>
          <span className="sep">·</span>
          <span>no uploads</span>
          <span className="sep">·</span>
          <span>no accounts or telemetry</span>
          <span className="sep">·</span>
          <span>
            <b>{tools.length}</b> tools
          </span>
          <span className="sep">·</span>
          <span>
            <b>{CATEGORY_ORDER.length}</b> categories
          </span>
        </div>
      </div>
    </section>
  )
}
