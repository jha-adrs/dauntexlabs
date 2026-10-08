'use client'

import { useMemo, useRef, useState } from 'react'
import { Button, Field, TextInput, IO, Panel, Notice } from '@/components/ui/kit'
import { weightBalance } from '@/lib/aviation'

type Row = { id: number; item: string; weight: string; arm: string }

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
const blank = (s: string) => s.trim() === ''

const START = ['Empty weight', 'Pilot and front passenger', 'Rear passengers', 'Baggage', 'Fuel']

export default function WeightAndBalanceCalculator() {
  const nextId = useRef(START.length)
  const [rows, setRows] = useState<Row[]>(START.map((item, id) => ({ id, item, weight: '', arm: '' })))
  const [minCg, setMinCg] = useState('')
  const [maxCg, setMaxCg] = useState('')
  const [maxW, setMaxW] = useState('')

  const update = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const add = () => setRows((rs) => [...rs, { id: nextId.current++, item: '', weight: '', arm: '' }])
  const remove = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id))

  const res = useMemo(() => {
    const used = rows.filter((r) => !(blank(r.weight) && blank(r.arm)))
    if (used.length === 0 || [minCg, maxCg, maxW].some(blank)) return null
    return weightBalance(
      used.map((r) => ({ item: r.item, weight: num(r.weight), arm: num(r.arm) })),
      { minCg: num(minCg), maxCg: num(maxCg), maxWeight: num(maxW) },
    )
  }, [rows, minCg, maxCg, maxW])

  return (
    <>
      <Notice kind="info">For training and planning only — always cross-check with your aircraft&apos;s POH and an E6B.</Notice>
      <Notice kind="info">Enter the numbers from your aircraft&apos;s POH — there is no aircraft database.</Notice>
      <IO>
        <Panel title="Loading" actions={<Button onClick={add}>Add item</Button>}>
          <p style={{ color: 'var(--mute)', margin: '0 0 8px' }}>
            Use one set of units throughout (e.g. lb and inches, or kg and mm). Rows left empty are ignored.
          </p>
          {rows.map((r) => (
            <div
              key={r.id}
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto', gap: 8, alignItems: 'end' }}
            >
              <Field label="Item">
                <TextInput value={r.item} onChange={(v) => update(r.id, { item: v })} placeholder="e.g. Baggage" />
              </Field>
              <Field label="Weight">
                <TextInput type="number" value={r.weight} onChange={(v) => update(r.id, { weight: v })} />
              </Field>
              <Field label="Arm">
                <TextInput type="number" value={r.arm} onChange={(v) => update(r.id, { arm: v })} />
              </Field>
              <Button onClick={() => remove(r.id)} title="Remove this item">
                Remove
              </Button>
            </div>
          ))}
        </Panel>
        <Panel title="Envelope and result">
          <Field label="Forward CG limit">
            <TextInput type="number" value={minCg} onChange={setMinCg} />
          </Field>
          <Field label="Aft CG limit">
            <TextInput type="number" value={maxCg} onChange={setMaxCg} />
          </Field>
          <Field label="Maximum weight">
            <TextInput type="number" value={maxW} onChange={setMaxW} />
          </Field>
          {!res && <Notice kind="info">Enter at least one item and the envelope limits to check weight and balance.</Notice>}
          {res && !res.ok && <Notice kind="error">{res.error}</Notice>}
          {res && res.ok && (
            <>
              <dl style={{ fontFamily: 'var(--font-mono)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: '0 0 12px' }}>
                <dt style={{ color: 'var(--mute)' }}>Total weight</dt>
                <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{res.totalWeight.toLocaleString('en-US', { maximumFractionDigits: 2 })}</dd>
                <dt style={{ color: 'var(--mute)' }}>Total moment</dt>
                <dd style={{ margin: 0 }}>{res.totalMoment.toLocaleString('en-US', { maximumFractionDigits: 2 })}</dd>
                <dt style={{ color: 'var(--mute)' }}>Centre of gravity</dt>
                <dd style={{ margin: 0, fontWeight: 700, color: 'var(--fg)' }}>{res.cg.toFixed(2)}</dd>
              </dl>
              {res.within ? (
                <Notice kind="success">Within limits — weight and CG are inside the envelope you entered.</Notice>
              ) : (
                <Notice kind="error">
                  Out of limits:{' '}
                  {res.reasons.join(' ')}
                </Notice>
              )}
            </>
          )}
        </Panel>
      </IO>
    </>
  )
}
