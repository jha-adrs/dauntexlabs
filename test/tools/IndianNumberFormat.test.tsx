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
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it.each(['abc', '-5', '10000000000000000001'])('shows a notice, never NaN, for %s', (v) => {
    render(<IndianNumberFormat />)
    type(v)
    expect(document.querySelector('.notice')).not.toBeNull()
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/)
    expect(screen.queryByRole('table')).toBeNull()
  })
})
