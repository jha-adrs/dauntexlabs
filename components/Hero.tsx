'use client'

import { tools, CATEGORY_ORDER } from '@/lib/tools'

interface Props {
  query: string
  setQuery: (q: string) => void
}

// Headline + the local-first differentiator + terminal-style filter prompt.
export default function Hero({ query, setQuery }: Props) {
  return (
    <section className="hero">
      <span className="beam" aria-hidden />

      <div className="shell hero-inner">
        <p className="eyebrow reveal" style={{ animationDelay: '40ms' }}>
          dauntexlabs <span>//</span> client-side toolchain
        </p>

        <h1 className="reveal" style={{ animationDelay: '120ms' }}>
          Everything runs
          <br />
          <span className="em">on your machine.</span>
        </h1>

        <p className="lede reveal" style={{ animationDelay: '220ms' }}>
          A growing rack of developer utilities, converters and generators. No uploads,
          no accounts, no telemetry — every byte is processed locally in your browser and
          never touches a server.
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
