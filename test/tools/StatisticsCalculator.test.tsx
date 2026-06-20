import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StatisticsCalculator from '@/components/tools/StatisticsCalculator'

function statValue(label: string): string {
  const labelEl = screen.getByText(label)
  const card = labelEl.parentElement as HTMLElement
  const value = card.children[1] as HTMLElement
  return value.textContent ?? ''
}

const DATA = '2 4 4 4 5 5 7 9'

describe('StatisticsCalculator', () => {
  it('prompts when input is empty', () => {
    render(<StatisticsCalculator />)
    expect(screen.getByText(/Enter a set of numbers/i)).toBeInTheDocument()
  })

  it('errors when no numbers are present', () => {
    render(<StatisticsCalculator />)
    fireEvent.change(screen.getByPlaceholderText(/2, 4, 4/), { target: { value: 'abc def' } })
    expect(screen.getByText(/No numbers found/i)).toBeInTheDocument()
  })

  it('computes the canonical data set "2 4 4 4 5 5 7 9"', () => {
    render(<StatisticsCalculator />)
    fireEvent.change(screen.getByPlaceholderText(/2, 4, 4/), { target: { value: DATA } })
    expect(statValue('Count')).toBe('8')
    expect(statValue('Sum')).toBe('40')
    expect(statValue('Mean')).toBe('5')
    expect(statValue('Median')).toBe('4.5')
    expect(statValue('Mode')).toBe('4')
    expect(statValue('Min')).toBe('2')
    expect(statValue('Max')).toBe('9')
    expect(statValue('Range')).toBe('7')
    // population variance = 4, std dev = 2
    expect(statValue('Population variance')).toBe('4')
    expect(statValue('Population std dev')).toBe('2')
    // sample std dev ≈ 2.138 (variance = 32/7 ≈ 4.5714)
    expect(statValue('Sample std dev')).toMatch(/^2\.138/)
  })

  it('parses comma- and newline-separated values, ignoring junk tokens', () => {
    render(<StatisticsCalculator />)
    fireEvent.change(screen.getByPlaceholderText(/2, 4, 4/), {
      target: { value: '10, 20\n30, oops, 40' },
    })
    expect(statValue('Count')).toBe('4')
    expect(statValue('Sum')).toBe('100')
    expect(statValue('Mean')).toBe('25')
  })

  it('reports no mode when nothing repeats', () => {
    render(<StatisticsCalculator />)
    fireEvent.change(screen.getByPlaceholderText(/2, 4, 4/), { target: { value: '1 2 3 4 5' } })
    // no value repeats → label is pluralized "Mode(s)" with value "none"
    expect(statValue('Mode(s)')).toBe('none')
    expect(statValue('Median')).toBe('3')
  })

  it('reports multiple modes sorted ascending', () => {
    render(<StatisticsCalculator />)
    fireEvent.change(screen.getByPlaceholderText(/2, 4, 4/), { target: { value: '5 5 1 1 9' } })
    expect(statValue('Mode(s)')).toBe('1, 5')
  })

  it('handles a single value (sample std dev undefined)', () => {
    render(<StatisticsCalculator />)
    fireEvent.change(screen.getByPlaceholderText(/2, 4, 4/), { target: { value: '42' } })
    expect(statValue('Count')).toBe('1')
    expect(statValue('Mean')).toBe('42')
    expect(statValue('Median')).toBe('42')
    expect(statValue('Population std dev')).toBe('0')
    expect(statValue('Sample std dev')).toBe('—')
  })

  it('computes quartiles and IQR (R type-7 interpolation)', () => {
    render(<StatisticsCalculator />)
    // 1..7 → Q1 = 2.5, median 4, Q3 = 5.5, IQR = 3
    fireEvent.change(screen.getByPlaceholderText(/2, 4, 4/), {
      target: { value: '1 2 3 4 5 6 7' },
    })
    expect(statValue('Q1 (25th pct)')).toBe('2.5')
    expect(statValue('Q3 (75th pct)')).toBe('5.5')
    expect(statValue('IQR')).toBe('3')
  })

  it('handles negative and decimal numbers', () => {
    render(<StatisticsCalculator />)
    fireEvent.change(screen.getByPlaceholderText(/2, 4, 4/), {
      target: { value: '-2 -1 0 1.5' },
    })
    expect(statValue('Count')).toBe('4')
    expect(statValue('Min')).toBe('-2')
    expect(statValue('Max')).toBe('1.5')
    expect(statValue('Sum')).toBe('-1.5')
  })
})
