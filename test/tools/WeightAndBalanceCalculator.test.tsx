import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WeightAndBalanceCalculator from '@/components/tools/WeightAndBalanceCalculator'

const change = (el: HTMLElement, v: string) => fireEvent.change(el, { target: { value: v } })
const fillRows = (data: [number, number][]) => {
  const w = screen.getAllByLabelText('Weight')
  const a = screen.getAllByLabelText('Arm')
  data.forEach(([wt, arm], i) => {
    change(w[i], String(wt))
    change(a[i], String(arm))
  })
}
const fillEnv = (min: string, max: string, mw: string) => {
  change(screen.getByLabelText('Forward CG limit'), min)
  change(screen.getByLabelText('Aft CG limit'), max)
  change(screen.getByLabelText('Maximum weight'), mw)
}

describe('WeightAndBalanceCalculator', () => {
  it('shows the notice and the no-database statement', () => {
    render(<WeightAndBalanceCalculator />)
    expect(screen.getByText(/For training and planning only/)).toBeInTheDocument()
    expect(screen.getByText("Enter the numbers from your aircraft's POH — there is no aircraft database.")).toBeInTheDocument()
  })

  it('computes total, moment and CG within limits', () => {
    render(<WeightAndBalanceCalculator />)
    fillRows([[1500, 85], [340, 87], [180, 95]])
    fillEnv('82', '93', '2300')
    expect(screen.getByText('2,020')).toBeInTheDocument()
    expect(screen.getByText('174,180')).toBeInTheDocument()
    expect(screen.getByText('86.23')).toBeInTheDocument()
    expect(screen.getByText(/Within limits/)).toBeInTheDocument()
  })

  it('flags overweight', () => {
    render(<WeightAndBalanceCalculator />)
    fillRows([[1500, 85], [340, 87], [180, 95]])
    fillEnv('82', '93', '2000')
    expect(screen.getByText(/Out of limits/)).toBeInTheDocument()
    expect(screen.getByText(/weight is over the maximum/i)).toBeInTheDocument()
  })

  it('adds and removes rows', () => {
    render(<WeightAndBalanceCalculator />)
    const n = screen.getAllByLabelText('Weight').length
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    expect(screen.getAllByLabelText('Weight')).toHaveLength(n + 1)
    fireEvent.click(screen.getAllByRole('button', { name: /^Remove/ })[0])
    expect(screen.getAllByLabelText('Weight')).toHaveLength(n)
  })
})
