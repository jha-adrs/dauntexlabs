'use client'

import { tools, CATEGORY_ORDER } from '@/lib/tools'

interface Props {
  query: string
  setQuery: (q: string) => void
}

// Headline + the local-first differentiator + terminal-style filter prompt.
export default function Hero({ query, setQuery }: Props) {
  const live = tools.filter((t) => t.status !== 'maintenance').length
  const rounded = Math.floor(live / 10) * 10 // 106 → "100+"
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

        <p className="eyebrow reveal" style={{ animationDelay: '40ms', marginTop: 16 }}>
          dauntexlabs <span>//</span> client-side toolkit
        </p>

        <h1 className="reveal" style={{ animationDelay: '120ms' }}>
          Everything runs
          <br />
          <span className="em">on your machine.</span>
        </h1>

        <p className="lede reveal" style={{ animationDelay: '220ms' }}>
          {rounded}+ free tools for developers, marketers, students and everyday tasks —
          converters, generators, formatters and calculators. No uploads, no accounts, no
          telemetry; every byte is processed locally in your browser.
        </p>

        <div className="prompt reveal" style={{ animationDelay: '320ms' }}>
          <span className="caret">›</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search modules — base64, csv, hash, jwt…"
            spellCheck={false}
            autoComplete="off"
            aria-label="Search tools"
          />
          {query && (
            <button className="clear" onClick={() => setQuery('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <dl className="stats reveal" style={{ animationDelay: '420ms' }}>
          <div>
            <dt>modules</dt>
            <dd>{tools.length}</dd>
          </div>
          <div>
            <dt>categories</dt>
            <dd>{CATEGORY_ORDER.length}</dd>
          </div>
          <div>
            <dt>bytes uploaded</dt>
            <dd className="em">0</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
