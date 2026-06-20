import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AbTestCalculator from '@/components/tools/AbTestCalculator'

function setInputs(a: { n: string; c: string }, b: { n: string; c: string }) {
  const visitorInputs = screen.getAllByPlaceholderText('1000')
  const conversionInputsA = screen.getByPlaceholderText('100')
  const conversionInputsB = screen.getByPlaceholderText('150')
  fireEvent.change(visitorInputs[0], { target: { value: a.n } })
  fireEvent.change(conversionInputsA, { target: { value: a.c } })
  fireEvent.change(visitorInputs[1], { target: { value: b.n } })
  fireEvent.change(conversionInputsB, { target: { value: b.c } })
}

describe('AbTestCalculator', () => {
  it('computes rates and uplift, flags significance at 95% for a clear winner', () => {
    render(<AbTestCalculator />)
    // defaults are already A 100/1000, B 150/1000
    setInputs({ n: '1000', c: '100' }, { n: '1000', c: '150' })

    // rate A 10%, rate B 15%
    expect(screen.getByText('10.00%')).toBeInTheDocument()
    expect(screen.getByText('15.00%')).toBeInTheDocument()
    // relative uplift +50%
    expect(screen.getByText('+50.00%')).toBeInTheDocument()
    // significant at 95%
    expect(screen.getByText(/Statistically significant at 95%/i)).toBeInTheDocument()
  })

  it('produces a z-score near 3.2 for 10% vs 15%', () => {
    render(<AbTestCalculator />)
    setInputs({ n: '1000', c: '100' }, { n: '1000', c: '150' })
    const zLabel = screen.getByText('z-score')
    const zValue = zLabel.parentElement?.querySelectorAll('span')[1]?.textContent ?? ''
    // pooled two-proportion z for 100/1000 vs 150/1000 ≈ 3.38
    expect(parseFloat(zValue)).toBeGreaterThan(3.0)
    expect(parseFloat(zValue)).toBeLessThan(3.5)
  })

  it('reports not significant for equal rates', () => {
    render(<AbTestCalculator />)
    setInputs({ n: '1000', c: '50' }, { n: '1000', c: '50' })
    expect(screen.getByText(/Not statistically significant at 95%/i)).toBeInTheDocument()
  })

  it('errors when a variant has zero visitors', () => {
    render(<AbTestCalculator />)
    setInputs({ n: '0', c: '0' }, { n: '1000', c: '150' })
    expect(screen.getByText(/at least one visitor/i)).toBeInTheDocument()
  })

  it('errors when conversions exceed visitors', () => {
    render(<AbTestCalculator />)
    setInputs({ n: '1000', c: '100' }, { n: '1000', c: '5000' })
    expect(screen.getByText(/cannot exceed visitors/i)).toBeInTheDocument()
  })
})
