'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Button, Toolbar, IO, Panel, Notice } from '@/components/ui/kit'

const PRESETS = [10, 15, 18, 20]

export default function TipCalculator() {
  const [billAmount, setBillAmount] = useState('')
  const [tipPct, setTipPct] = useState('18')
  const [numPeople, setNumPeople] = useState('1')

  const result = useMemo(() => {
    if (!billAmount) return null

    const bill = parseFloat(billAmount)
    const tip = parseFloat(tipPct)
    const people = parseInt(numPeople, 10)

    if (isNaN(bill) || isNaN(tip)) {
      return { error: 'Enter valid numbers for bill amount and tip percentage.' }
    }
    if (bill < 0) {
      return { error: 'Bill amount cannot be negative.' }
    }
    if (tip < 0) {
      return { error: 'Tip percentage cannot be negative.' }
    }
    if (!people || people < 1 || !Number.isInteger(people)) {
      return { error: 'Number of people must be at least 1.' }
    }

    const tipAmount = bill * (tip / 100)
    const total = bill + tipAmount
    const perPersonTotal = total / people
    const perPersonTip = tipAmount / people

    return {
      tipAmount,
      total,
      perPersonTotal,
      perPersonTip,
      people,
    }
  }, [billAmount, tipPct, numPeople])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <>
      <Toolbar>
        {PRESETS.map((p) => (
          <Button
            key={p}
            variant={tipPct === String(p) ? 'primary' : 'ghost'}
            onClick={() => setTipPct(String(p))}
          >
            {p}%
          </Button>
        ))}
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <Field label="Bill Amount" hint="Total amount before tip">
            <TextInput
              type="number"
              value={billAmount}
              onChange={setBillAmount}
              placeholder="e.g. 100"
            />
          </Field>
          <Field label="Tip %" hint="Tip percentage (or pick a preset above)">
            <TextInput
              type="number"
              value={tipPct}
              onChange={setTipPct}
              placeholder="e.g. 18"
            />
          </Field>
          <Field label="Number of People" hint="Split the bill among this many people">
            <TextInput
              type="number"
              value={numPeople}
              onChange={setNumPeople}
              placeholder="e.g. 4"
            />
          </Field>
        </Panel>

        <Panel title="results">
          {!result && (
            <Notice kind="info">Enter a bill amount to calculate the tip.</Notice>
          )}
          {result && 'error' in result && (
            <Notice kind="error">{result.error}</Notice>
          )}
          {result && !('error' in result) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}>
                <div style={{
                  padding: '1rem',
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Tip Amount
                  </div>
                  <div style={{ color: 'var(--bone)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                    {fmt(result.tipAmount)}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>total tip</div>
                </div>

                <div style={{
                  padding: '1rem',
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Total Bill
                  </div>
                  <div style={{ color: 'var(--acid)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                    {fmt(result.total)}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>bill + tip</div>
                </div>

                {result.people > 1 && (
                  <>
                    <div style={{
                      padding: '1rem',
                      background: 'var(--ink-800)',
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                    }}>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        Per Person
                      </div>
                      <div style={{ color: 'var(--acid)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                        {fmt(result.perPersonTotal)}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>total each</div>
                    </div>

                    <div style={{
                      padding: '1rem',
                      background: 'var(--ink-800)',
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                    }}>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        Tip Per Person
                      </div>
                      <div style={{ color: 'var(--bone)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                        {fmt(result.perPersonTip)}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>tip each</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
