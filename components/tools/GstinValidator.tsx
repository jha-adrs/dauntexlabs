'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { DownloadButton, Notice, Panel, TextArea } from '@/components/ui/kit'
import { validateGstin } from '@/lib/gstin'
import { toCsv } from '@/lib/csv-write'

const th: CSSProperties = { padding: '0.4rem 0.5rem', fontWeight: 500, textAlign: 'left' }
const td: CSSProperties = { padding: '0.35rem 0.5rem', verticalAlign: 'top' }
const mono: CSSProperties = { ...td, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }

const HEADER = ['GSTIN', 'Valid', 'State', 'State code', 'PAN', 'Entity type', 'Registration no.', 'Error']

export default function GstinValidator() {
  const [text, setText] = useState('')
  const results = useMemo(
    () => text.split(/\r?\n/).filter((l) => l.trim()).map(validateGstin),
    [text],
  )
  const valid = results.filter((r) => r.ok).length
  const csv = useMemo(
    () =>
      results.length
        ? toCsv([
            HEADER,
            ...results.map((r) =>
              r.ok
                ? [r.gstin, 'Yes', r.state, r.stateCode, r.pan, r.entity, r.entityNo, '']
                : [r.gstin, 'No', '', '', '', '', '', r.error],
            ),
          ])
        : '',
    [results],
  )

  return (
    <>
      <Panel title="GSTINs">
        <TextArea
          value={text}
          onChange={setText}
          placeholder="Paste one GSTIN per line, e.g. 27AAPFU0939F1ZV"
          rows={6}
        />
      </Panel>

      <Notice>
        This checks the format, state code and check character only. It does not look up whether a GSTIN is
        registered or active — everything is processed on your device.
      </Notice>

      {results.length > 0 && (
        <Panel
          title="Results"
          actions={
            <DownloadButton
              text={csv ? '﻿' + csv : ''}
              filename="gstin-results.csv"
              mime="text/csv;charset=utf-8"
              label="Download CSV"
            />
          }
        >
          <p style={{ margin: '0 0 0.75rem', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
            {valid} valid · {results.length - valid} invalid
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-strong)', color: 'var(--mute)' }}>
                  <th style={th}>GSTIN</th>
                  <th style={th}>Status</th>
                  <th style={th}>State</th>
                  <th style={th}>PAN</th>
                  <th style={th}>Entity type</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={mono}>{r.gstin}</td>
                    {r.ok ? (
                      <>
                        <td style={{ ...td, color: 'var(--accent)' }}>Valid</td>
                        <td style={td}>{r.state}</td>
                        <td style={mono}>{r.pan}</td>
                        <td style={td}>{r.entity}</td>
                      </>
                    ) : (
                      <td style={{ ...td, color: 'var(--danger)' }} colSpan={4}>
                        {r.error}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  )
}
