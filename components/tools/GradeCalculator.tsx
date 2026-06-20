'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Toolbar,
  Field,
  TextInput,
  Button,
  Notice,
} from '@/components/ui/kit'

type Row = { id: number; name: string; weight: string; score: string }

let nextId = 1
function makeRow(weight = '', score = ''): Row {
  return { id: nextId++, name: '', weight, score }
}

export default function GradeCalculator() {
  const [mode, setMode] = useState('current')

  /* ---- current-grade mode ---------------------------------------- */
  const [rows, setRows] = useState<Row[]>([
    makeRow('50', '90'),
    makeRow('50', '80'),
  ])

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function addRow() {
    setRows((rs) => [...rs, makeRow()])
  }
  function removeRow(id: number) {
    setRows((rs) => rs.filter((r) => r.id !== id))
  }

  const current = useMemo(() => {
    let weightedSum = 0
    let weightSum = 0
    let invalid = false
    for (const r of rows) {
      const w = r.weight.trim()
      const s = r.score.trim()
      if (w === '' && s === '') continue
      const wn = Number(w)
      const sn = Number(s)
      if (!Number.isFinite(wn) || !Number.isFinite(sn) || wn < 0) {
        invalid = true
        continue
      }
      weightedSum += sn * wn
      weightSum += wn
    }
    if (invalid)
      return { value: null as number | null, weightSum, error: 'Weight and score must be numbers (weight ≥ 0).' }
    if (weightSum === 0) return { value: null as number | null, weightSum: 0, error: '' }
    return { value: weightedSum / weightSum, weightSum, error: '' }
  }, [rows])

  /* ---- final-exam-needed mode ------------------------------------ */
  const [curGrade, setCurGrade] = useState('85')
  const [finalWeight, setFinalWeight] = useState('30')
  const [desired, setDesired] = useState('90')

  const needed = useMemo(() => {
    const cg = Number(curGrade.trim())
    const fwPct = Number(finalWeight.trim())
    const want = Number(desired.trim())
    if (curGrade.trim() === '' || finalWeight.trim() === '' || desired.trim() === '')
      return { value: null as number | null, error: '' }
    if (![cg, fwPct, want].every(Number.isFinite))
      return { value: null as number | null, error: 'All fields must be numbers.' }
    if (fwPct <= 0 || fwPct > 100)
      return { value: null as number | null, error: 'Final weight must be between 0 and 100%.' }
    const w = fwPct / 100
    const required = (want - cg * (1 - w)) / w
    return { value: required, error: '' }
  }, [curGrade, finalWeight, desired])

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'current', label: 'Current grade' },
            { value: 'final', label: 'Final exam needed' },
          ]}
        />
      </Toolbar>

      {mode === 'current' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {rows.map((r, i) => (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) 8rem 8rem auto',
                  gap: '0.6rem',
                  alignItems: 'end',
                }}
              >
                <Field label={i === 0 ? 'category' : undefined}>
                  <TextInput
                    value={r.name}
                    onChange={(v) => updateRow(r.id, { name: v })}
                    placeholder={`Category ${i + 1}`}
                  />
                </Field>
                <Field label={i === 0 ? 'weight %' : undefined}>
                  <TextInput
                    type="number"
                    value={r.weight}
                    onChange={(v) => updateRow(r.id, { weight: v })}
                    placeholder="0"
                  />
                </Field>
                <Field label={i === 0 ? 'score %' : undefined}>
                  <TextInput
                    type="number"
                    value={r.score}
                    onChange={(v) => updateRow(r.id, { score: v })}
                    placeholder="0"
                  />
                </Field>
                <Button
                  variant="danger"
                  onClick={() => removeRow(r.id)}
                  disabled={rows.length === 1}
                  title="Remove category"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Button variant="ghost" onClick={addRow}>
              + Add category
            </Button>
          </div>

          {current.error && (
            <div style={{ marginTop: '1rem' }}>
              <Notice kind="error">{current.error}</Notice>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
              gap: '0.75rem',
              marginTop: '1.25rem',
            }}
          >
            <ResultCard
              label="Final grade"
              value={current.value === null ? '—' : `${current.value.toFixed(2)}%`}
              accent
            />
            <ResultCard label="Total weight" value={`${current.weightSum}%`} />
          </div>
          {current.value !== null && current.weightSum !== 100 && (
            <div style={{ marginTop: '0.75rem' }}>
              <Notice kind="info">
                Weights total {current.weightSum}% (not 100%). The grade shown is the
                weighted average of the categories entered.
              </Notice>
            </div>
          )}
        </>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
              gap: '0.75rem',
            }}
          >
            <Field label="current grade %" hint="Your grade before the final">
              <TextInput
                type="number"
                value={curGrade}
                onChange={setCurGrade}
                placeholder="85"
              />
            </Field>
            <Field label="final weight %" hint="How much the final counts">
              <TextInput
                type="number"
                value={finalWeight}
                onChange={setFinalWeight}
                placeholder="30"
              />
            </Field>
            <Field label="desired overall %" hint="Grade you want in the end">
              <TextInput
                type="number"
                value={desired}
                onChange={setDesired}
                placeholder="90"
              />
            </Field>
          </div>

          {needed.error && (
            <div style={{ marginTop: '1rem' }}>
              <Notice kind="error">{needed.error}</Notice>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
              gap: '0.75rem',
              marginTop: '1.25rem',
            }}
          >
            <ResultCard
              label="Required on final"
              value={needed.value === null ? '—' : `${needed.value.toFixed(2)}%`}
              accent
            />
          </div>

          {needed.value !== null && needed.value > 100 && (
            <div style={{ marginTop: '0.75rem' }}>
              <Notice kind="error">
                You need more than 100% on the final — this overall grade is not
                reachable with the final alone.
              </Notice>
            </div>
          )}
          {needed.value !== null && needed.value <= 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <Notice kind="success">
                You have already secured this grade — even a 0% on the final keeps you
                at or above your target.
              </Notice>
            </div>
          )}
        </>
      )}
    </>
  )
}

function ResultCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        background: 'var(--ink-850)',
        borderRadius: 8,
        padding: '0.9rem 1rem',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--mute)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.6rem',
          marginTop: '0.35rem',
          color: accent ? 'var(--acid)' : 'var(--bone)',
        }}
      >
        {value}
      </div>
    </div>
  )
}
