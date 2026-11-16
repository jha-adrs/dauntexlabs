'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, CopyButton, Notice } from '@/components/ui/kit'
import { parseAmount, describeAmount } from '@/lib/indian-number'

const cell = { padding: '8px 10px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' } as const

export default function IndianNumberFormat() {
  const [text, setText] = useState('')

  const res = useMemo(() => parseAmount(text), [text])
  const rows = useMemo(() => {
    if (!res || !res.ok) return null
    const d = describeAmount(res.value)
    return [
      { label: 'Indian commas', value: d.indian, mono: true },
      { label: 'International commas', value: d.international, mono: true },
      ...d.indianScale.map((s) => ({ label: `In ${s.unit}`, value: s.text, mono: true })),
      ...d.internationalScale.map((s) => ({ label: `In ${s.unit}`, value: s.text, mono: true })),
      { label: 'Words (Indian)', value: d.wordsIndian, mono: false },
      { label: 'Words (international)', value: d.wordsInternational, mono: false },
      ...(d.zeros === undefined
        ? []
        : [{ label: 'Zeros and digits', value: `${d.zeros} ${d.zeros === 1 ? 'zero' : 'zeros'} · ${d.digits} ${d.digits === 1 ? 'digit' : 'digits'}`, mono: false }]),
    ]
  }, [res])

  return (
    <>
      <Field
        label="Number or phrase"
        hint="e.g. 2.5 crore, 50k crore, 1.5 lakh, 3.8 billion or 12345678 · up to 10^18, two decimals"
      >
        <TextInput value={text} onChange={setText} placeholder="e.g. 2.5 crore" />
      </Field>

      <div aria-live="polite">
      {res && !res.ok && <Notice kind="error">{res.error}</Notice>}

      {rows && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, marginTop: 14 }}>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 500, color: 'var(--mute)', width: '30%' }}>
                  {r.label}
                </th>
                <td style={{ ...cell, fontFamily: r.mono ? 'var(--font-mono)' : undefined, wordBreak: 'break-word' }}>
                  {r.value}
                </td>
                <td style={{ ...cell, textAlign: 'right', width: 1 }}>
                  <CopyButton text={r.value === '—' ? '' : r.value} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </>
  )
}
