'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { TextArea, IO, Panel, Notice } from '@/components/ui/kit'
import { decodeMetar, type FlightCat, type Row } from '@/lib/metar'

export const th: CSSProperties = { padding: '0.4rem 0.5rem', fontWeight: 500, textAlign: 'left', color: 'var(--mute)' }
export const td: CSSProperties = { padding: '0.35rem 0.5rem', verticalAlign: 'top', borderTop: '1px solid var(--line)' }

const CAT_STYLE: Record<FlightCat, CSSProperties> = {
  VFR: { color: 'var(--accent)', background: 'var(--accent-tint)' },
  MVFR: { color: 'var(--warn)', background: 'var(--warn-tint)' },
  IFR: { color: 'var(--danger)', background: 'var(--danger-tint)' },
  LIFR: { color: 'var(--surface)', background: 'var(--danger)' },
}

export function CategoryBadge({ cat }: { cat: FlightCat }) {
  return (
    <span
      style={{
        ...CAT_STYLE[cat],
        display: 'inline-block',
        padding: '0.15rem 0.6rem',
        borderRadius: 999,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {cat}
    </span>
  )
}

export function RowsTable({ rows }: { rows: Row[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th style={th}>Group</th>
            <th style={th}>Element</th>
            <th style={th}>Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const unknown = r.label === 'Not decoded'
            return (
              <tr key={i}>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{r.group}</td>
                <td style={{ ...td, color: unknown ? 'var(--warn)' : 'var(--mute)' }}>{r.label}</td>
                <td style={{ ...td, fontFamily: unknown ? 'var(--font-mono)' : undefined }}>{r.meaning}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export const TRAINING_NOTICE = 'For training and planning only — always use an official briefing for flight decisions.'

export default function MetarDecoder() {
  const [text, setText] = useState('')
  const r = useMemo(() => (text.trim() ? decodeMetar(text) : null), [text])

  return (
    <>
      <Notice kind="info">{TRAINING_NOTICE}</Notice>
      <IO>
        <Panel title="METAR or SPECI">
          <p style={{ margin: '0 0 0.75rem', color: 'var(--mute)' }}>
            Paste a METAR from your briefing source — this page does not fetch weather.
          </p>
          <TextArea
            value={text}
            onChange={setText}
            rows={6}
            placeholder="e.g. KJFK 121651Z 31015G25KT 10SM FEW050 SCT250 22/12 A3002 RMK AO2 SLP165"
          />
        </Panel>
        <Panel title="Decoded">
          {!r && <Notice kind="info">Paste a report to see it decoded group by group.</Notice>}
          {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
          {r && r.ok && (
            <>
              <p style={{ margin: '0 0 0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.station}</span>
                {r.category ? (
                  <>
                    <span style={{ color: 'var(--mute)' }}>Flight category</span>
                    <CategoryBadge cat={r.category} />
                  </>
                ) : (
                  <span style={{ color: 'var(--mute)' }}>Flight category unknown (no visibility or cloud group)</span>
                )}
              </p>
              <RowsTable rows={r.rows} />
            </>
          )}
        </Panel>
      </IO>
    </>
  )
}
