'use client'

import { useMemo, useState } from 'react'
import { TextInput, Field, Panel, IO, CopyButton, Notice } from '@/components/ui/kit'
import { parseCron, describe, nextRuns } from '@/lib/cron'

/* ── component ───────────────────────────────────────────────────────────── */

const EXAMPLES = ['*/15 * * * *', '0 9 * * 1-5', '30 4 1 * *', '0 0 * * 0', '5 0 * 8 *']

export default function CronExplainer() {
  const [expr, setExpr] = useState('*/15 * * * *')

  const result = useMemo(() => {
    try {
      const parsed = parseCron(expr)
      const description = describe(parsed)
      const runs = nextRuns(parsed, new Date(), 5)
      return { ok: true as const, description, runs }
    } catch (e) {
      return { ok: false as const, error: (e as Error).message }
    }
  }, [expr])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Panel title="cron expression">
        <Field
          label="Expression"
          hint="5 fields: minute hour day-of-month month day-of-week"
        >
          <TextInput value={expr} onChange={setExpr} placeholder="*/15 * * * *" />
        </Field>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="btn btn-ghost btn-sm"
              onClick={() => setExpr(ex)}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {ex}
            </button>
          ))}
        </div>
      </Panel>

      {!result.ok ? (
        <Notice kind="error">{result.error}</Notice>
      ) : (
        <IO>
          <Panel
            title="meaning"
            actions={<CopyButton text={result.description} />}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                lineHeight: 1.5,
                color: 'var(--acid)',
                margin: 0,
              }}
            >
              {result.description}
            </p>
          </Panel>

          <Panel title="next 5 runs">
            {result.runs.length === 0 ? (
              <Notice kind="info">
                No runs found within the next ~5 years (the search is bounded).
              </Notice>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.runs.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5rem 1fr',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      background: 'var(--ink-850)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--mute)',
                      }}
                    >
                      {i + 1}
                    </span>
                    <code
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.85rem',
                        color: 'var(--bone)',
                      }}
                      title={d.toISOString()}
                    >
                      {d.toLocaleString()}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </IO>
      )}
    </div>
  )
}
