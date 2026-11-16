'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, Notice } from '@/components/ui/kit'
import { attendance, formatPct } from '@/lib/attendance'

const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
const noun = (n: number) => (n === 1 ? 'class' : 'classes')
const classes = (n: number) => `${n} ${noun(n)}`
const remainingClasses = (n: number) => `${n} remaining ${noun(n)}`

export default function AttendanceCalculator() {
  const [held, setHeld] = useState('')
  const [attended, setAttended] = useState('')
  const [target, setTarget] = useState('75')
  const [remaining, setRemaining] = useState('')

  const r = useMemo(() => {
    if (held.trim() === '' || attended.trim() === '') return null
    return attendance({
      held: num(held),
      attended: num(attended),
      target: num(target),
      remaining: remaining.trim() === '' ? undefined : num(remaining),
    })
  }, [held, attended, target, remaining])

  const p = String(num(target))
  const plan = r && r.ok && r.plan && r.plan.remaining > 0 ? r.plan : null
  const hideStatus = !!(r && r.ok && plan && r.mustAttend === 0 && r.canMiss > plan.remaining)

  return (
    <IO>
      <Panel title="Inputs">
        <Field label="Classes held" hint="Total classes so far">
          <TextInput type="number" value={held} onChange={setHeld} placeholder="e.g. 50" />
        </Field>
        <Field label="Classes attended">
          <TextInput type="number" value={attended} onChange={setAttended} placeholder="e.g. 42" />
        </Field>
        <Field label="Required attendance (%)" hint="Varies by institution — check your own rule">
          <TextInput type="number" value={target} onChange={setTarget} placeholder="75" />
        </Field>
        <Field label="Classes remaining (optional)" hint="Classes left in the term, if you know">
          <TextInput type="number" value={remaining} onChange={setRemaining} placeholder="e.g. 20" />
        </Field>
      </Panel>
      <Panel title="Result">
        {!r && <Notice kind="info">Enter classes held and attended to see your attendance.</Notice>}
        {r && !r.ok && <Notice kind="error">{r.error}</Notice>}
        {r && r.ok && (
          <>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
              <dt style={{ color: 'var(--mute)' }}>Current attendance</dt>
              <dd style={{ margin: 0, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>
                {formatPct(r.percent)}%
              </dd>
            </dl>
            {!hideStatus && (
              <p style={{ margin: '12px 0 0' }}>
                {r.mustAttend === 0 &&
                  `You can miss ${classes(r.canMiss)} in a row and stay at or above ${p}%.`}
                {r.mustAttend !== null &&
                  r.mustAttend > 0 &&
                  `You are below ${p}%. You need to attend the next ${classes(r.mustAttend)} in a row to reach it.`}
                {r.mustAttend === null && `You have missed at least one class, so ${p}% can no longer be reached.`}
              </p>
            )}
            {plan && (
              <p style={{ margin: '12px 0 0' }}>
                {!plan.reachable
                  ? `${p}% is not reachable in the ${remainingClasses(plan.remaining)}; the best possible is ${formatPct(plan.best)}% if you attend all of them.`
                  : plan.needed === 0
                    ? `You can miss all ${remainingClasses(plan.remaining)} and still finish at or above ${p}%.`
                    : `You need to attend at least ${plan.needed} of the ${remainingClasses(plan.remaining)}; you can miss up to ${plan.canMiss} and finish at or above ${p}%.`}
              </p>
            )}
          </>
        )}
      </Panel>
    </IO>
  )
}
