'use client'

import { useMemo, useState } from 'react'
import { TextArea, IO, Panel, Notice } from '@/components/ui/kit'
import { decodeTaf, type TafPeriod } from '@/lib/metar'
import { RowsTable, TRAINING_NOTICE } from '@/components/tools/MetarDecoder'

function periodTitle(p: TafPeriod): string {
  switch (p.kind) {
    case 'BASE':
      return p.from ? `Base forecast ${p.from} to ${p.to} UTC` : 'Base forecast'
    case 'FM':
      return `From ${p.from} to ${p.to} UTC`
    case 'TEMPO':
      return `Temporarily ${p.from} to ${p.to} UTC`
    case 'BECMG':
      return `Becoming ${p.from} to ${p.to} UTC`
    case 'PROB':
      return `${p.prob}% probability ${p.from} to ${p.to} UTC`
  }
}

export default function TafDecoder() {
  const [text, setText] = useState('')
  const r = useMemo(() => (text.trim() ? decodeTaf(text) : null), [text])

  return (
    <>
      <Notice kind="info">{TRAINING_NOTICE}</Notice>
      <IO>
        <Panel title="TAF">
          <p style={{ margin: '0 0 0.75rem', color: 'var(--mute)' }}>
            Paste a TAF from your briefing source — this page does not fetch weather.
          </p>
          <TextArea
            value={text}
            onChange={setText}
            rows={8}
            placeholder="e.g. TAF KJFK 081130Z 0812/0918 31010KT P6SM FEW250 FM081800 30012G20KT P6SM SCT050"
          />
        </Panel>
        <Panel title="Decoded">
          {!r && <Notice kind="info">Paste a forecast to see each period decoded.</Notice>}
          {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
          {r && r.ok && (
            <>
              <p style={{ margin: '0 0 0.75rem', color: 'var(--mute)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--fg)' }}>{r.station}</span>
                {r.issued && ` · issued ${r.issued}`}
                {r.valid && ` · valid ${r.valid}`}
              </p>
              {r.periods.map((p, i) => (
                <section key={i} style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem' }}>{periodTitle(p)}</h3>
                  {p.rows.length > 0 ? (
                    <RowsTable rows={p.rows} />
                  ) : (
                    <p style={{ margin: 0, color: 'var(--mute)' }}>No groups in this period.</p>
                  )}
                </section>
              ))}
            </>
          )}
        </Panel>
      </IO>
    </>
  )
}
