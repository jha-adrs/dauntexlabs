'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, Notice } from '@/components/ui/kit'

export default function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [varCostPerUnit, setVarCostPerUnit] = useState('')

  const result = useMemo(() => {
    const fixed = parseFloat(fixedCosts)
    const price = parseFloat(pricePerUnit)
    const varCost = parseFloat(varCostPerUnit)

    if (!fixedCosts && !pricePerUnit && !varCostPerUnit) return null

    if (isNaN(fixed) || isNaN(price) || isNaN(varCost)) {
      return { error: 'Enter valid numbers for all three fields.' }
    }
    if (fixed < 0) {
      return { error: 'Fixed costs cannot be negative.' }
    }
    if (price <= 0) {
      return { error: 'Price per unit must be greater than zero.' }
    }
    if (varCost < 0) {
      return { error: 'Variable cost per unit cannot be negative.' }
    }
    if (price <= varCost) {
      return { error: 'Price per unit must be greater than variable cost per unit (contribution margin must be positive).' }
    }

    const contribution = price - varCost
    const contributionPct = (contribution / price) * 100
    const beUnits = Math.ceil(fixed / contribution)
    const beRevenue = beUnits * price

    return {
      contribution,
      contributionPct,
      beUnits,
      beRevenue,
    }
  }, [fixedCosts, pricePerUnit, varCostPerUnit])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <>
      <IO>
        <Panel title="inputs">
          <Field label="Fixed Costs" hint="Total fixed overhead (rent, salaries, etc.)">
            <TextInput
              type="number"
              value={fixedCosts}
              onChange={setFixedCosts}
              placeholder="e.g. 1000"
            />
          </Field>
          <Field label="Price per Unit" hint="Selling price of one unit">
            <TextInput
              type="number"
              value={pricePerUnit}
              onChange={setPricePerUnit}
              placeholder="e.g. 10"
            />
          </Field>
          <Field label="Variable Cost per Unit" hint="Cost to produce one unit">
            <TextInput
              type="number"
              value={varCostPerUnit}
              onChange={setVarCostPerUnit}
              placeholder="e.g. 5"
            />
          </Field>
        </Panel>

        <Panel title="results">
          {!result && (
            <Notice kind="info">Enter fixed costs, price per unit, and variable cost per unit to calculate your break-even point.</Notice>
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
                    Break-Even Units
                  </div>
                  <div style={{ color: 'var(--acid)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                    {result.beUnits.toLocaleString()}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>units</div>
                </div>

                <div style={{
                  padding: '1rem',
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Break-Even Revenue
                  </div>
                  <div style={{ color: 'var(--acid)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                    {fmt(result.beRevenue)}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>total revenue needed</div>
                </div>

                <div style={{
                  padding: '1rem',
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Contribution Margin
                  </div>
                  <div style={{ color: 'var(--bone)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                    {fmt(result.contribution)}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>per unit</div>
                </div>

                <div style={{
                  padding: '1rem',
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Contribution Margin %
                  </div>
                  <div style={{ color: 'var(--bone)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                    {result.contributionPct.toFixed(2)}%
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>of selling price</div>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
