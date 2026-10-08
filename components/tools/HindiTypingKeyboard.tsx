'use client'

// Design: the left box holds the raw keys exactly as typed on an English keyboard, and the
// Hindi on the right is derived from them with typeKeys(). Keeping the raw sequence as the
// source of truth means Backspace, selection, paste and undo all behave natively — and
// Remington's reordering (ि typed before its letter, reph after) is recomputed on every edit.

import { useMemo, useState } from 'react'
import {
  Segmented,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'
import { typeKeys, CHART, type Layout } from '@/lib/hindi-keyboard'

const NAME: Record<Layout, string> = { remington: 'Remington (Gail)', inscript: 'InScript' }

// Matras, halant and other combining marks are shown on a dotted circle in the chart.
const COMBINING = /^[ऀ-ःऺ-ॏ॑-ॗॢॣ]/

export default function HindiTypingKeyboard() {
  const [layout, setLayout] = useState<Layout>('remington')
  const [keys, setKeys] = useState('')
  const output = useMemo(() => typeKeys(keys, layout), [keys, layout])

  return (
    <>
      <Toolbar>
        <Segmented
          value={layout}
          onChange={(v) => setLayout(v as Layout)}
          options={[
            { value: 'remington', label: 'Remington (Gail)' },
            { value: 'inscript', label: 'InScript' },
          ]}
        />
      </Toolbar>

      <Notice>
        {layout === 'remington'
          ? 'Remington (Gail) is the Kruti Dev typewriter layout. Type ि before its letter (f then g gives हि) and the reph after the syllable, as on a typewriter.'
          : 'InScript is the standard Indian layout. Type in reading order: letter, then matra. Join letters with d (halant): k d k gives क्क.'}
      </Notice>

      <IO>
        <Panel title="Keys you type">
          <TextArea
            value={keys}
            onChange={setKeys}
            placeholder={`Type here with the ${NAME[layout]} layout…`}
            rows={10}
          />
        </Panel>
        <Panel
          title="Hindi (Unicode)"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton
                text={output}
                filename="hindi.txt"
                mime="text/plain;charset=utf-8"
                label="Download .txt"
              />
            </>
          }
        >
          <TextArea
            value={output}
            readOnly
            placeholder="Hindi text appears here…"
            rows={10}
            mono={false}
          />
        </Panel>
      </IO>

      <Panel title={`${NAME[layout]} layout`}>
        <div
          role="table"
          aria-label={`${NAME[layout]} layout chart`}
          style={{ display: 'grid', gap: 8, maxWidth: '100%', overflowX: 'auto' }}
        >
          {CHART[layout].map((row, i) => (
            <div key={i} role="row" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {row.map(({ key, out }) => (
                <div
                  key={key}
                  role="cell"
                  title={`${key} → ${out}`}
                  style={{
                    minWidth: 40,
                    padding: '4px 6px',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    background: 'var(--surface-soft)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  <div style={{ fontSize: 18, color: 'var(--fg)' }}>
                    {COMBINING.test(out) ? `◌${out}` : out}
                  </div>
                  <div
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mute)' }}
                  >
                    {key}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
