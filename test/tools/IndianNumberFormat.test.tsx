import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import IndianNumberFormat from '@/components/tools/IndianNumberFormat'

function type(v: string) {
  fireEvent.change(screen.getByPlaceholderText('e.g. 2.5 crore'), { target: { value: v } })
}

describe('IndianNumberFormat', () => {
  it('shows nothing for empty input', () => {
    render(<IndianNumberFormat />)
    expect(screen.queryByRole('table')).toBeNull()
    expect(document.querySelector('.notice')).toBeNull()
  })

  it('converts a phrase into every row', () => {
    render(<IndianNumberFormat />)
    type('2.5 crore')
    expect(screen.getByText('2,50,00,000')).toBeInTheDocument()
    expect(screen.getByText('25,000,000')).toBeInTheDocument()
    expect(screen.getByText('250 lakh')).toBeInTheDocument()
    expect(screen.getByText('25 million')).toBeInTheDocument()
    expect(screen.getByText('Two Crore Fifty Lakh')).toBeInTheDocument()
    expect(screen.getByText('Twenty-Five Million')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /copy/i }).length).toBeGreaterThanOrEqual(8)
  })

  it('counts zeros', () => {
    render(<IndianNumberFormat />)
    type('10000000')
    expect(screen.getByText('7 zeros · 8 digits')).toBeInTheDocument()
  })

  it('hides the zeros row for fractional values', () => {
    render(<IndianNumberFormat />)
    type('1.5')
    expect(screen.queryByText(/zeros ·/)).toBeNull()
  })

  it('shows a dash for Indian words beyond 15 digits', () => {
    render(<IndianNumberFormat />)
    type('1000000000000000000')
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('announces results politely', () => {
    const { container } = render(<IndianNumberFormat />)
    type('abc')
    expect(container.querySelector('[aria-live="polite"] .notice')).not.toBeNull()
    type('5 crore in million')
    expect(container.querySelector('[aria-live="polite"] table')).not.toBeNull()
    expect(screen.getByText('50 million')).toBeInTheDocument()
  })

  it.each(['abc', '-5', '10000000000000000001'])('shows a notice, never NaN, for %s', (v) => {
    render(<IndianNumberFormat />)
    type(v)
    expect(document.querySelector('.notice')).not.toBeNull()
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/)
    expect(screen.queryByRole('table')).toBeNull()
  })
})
