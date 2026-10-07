'use client'

import { useMemo, useState } from 'react'
import { Toolbar, Field, TextInput, Toggle, Segmented, Panel, CopyButton, Notice } from '@/components/ui/kit'
import { rupeesInWords, type RupeeLang } from '@/lib/rupees'

export default function AmountInWordsRupees() {
  const [amount, setAmount] = useState('')
  const [lang, setLang] = useState<RupeeLang>('en')
  const [only, setOnly] = useState(true)

  const res = useMemo(
    () => (amount.trim() ? rupeesInWords(amount, lang, { only }) : null),
    [amount, lang, only],
  )

  return (
    <>
      <Toolbar>
        <Segmented
          value={lang}
          onChange={(v) => setLang(v as RupeeLang)}
          options={[
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'Hindi' },
          ]}
        />
        <Toggle checked={only} onChange={setOnly} label='Add "Only"' />
      </Toolbar>

      <Field label="Amount in rupees" hint="Up to ₹99,99,99,99,99,999.99 · two decimals for paise">
        <TextInput value={amount} onChange={setAmount} placeholder="e.g. 1,25,000.50" />
      </Field>

      {res && !res.ok && <Notice kind="error">{res.error}</Notice>}

      {res && res.ok && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          <Panel title="In words" actions={<CopyButton text={res.words} />}>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>{res.words}</p>
          </Panel>
          <Panel title="Indian digit grouping" actions={<CopyButton text={res.formatted} />}>
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 18 }}>{res.formatted}</p>
          </Panel>
        </div>
      )}
    </>
  )
}
