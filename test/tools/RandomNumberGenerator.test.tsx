import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RandomNumberGenerator from '@/components/tools/RandomNumberGenerator'

function setup(min: string, max: string, count: string, unique = false) {
  render(<RandomNumberGenerator />)

  // Min, Max, Count fields (in order they appear)
  const [minInput, maxInput, countInput] = screen.getAllByRole('spinbutton')
  fireEvent.change(minInput, { target: { value: min } })
  fireEvent.change(maxInput, { target: { value: max } })
  fireEvent.change(countInput, { target: { value: count } })

  if (unique) {
    fireEvent.click(screen.getByLabelText('Unique values'))
  }

  fireEvent.click(screen.getByRole('button', { name: /generate/i }))
}

describe('RandomNumberGenerator', () => {
  it('shows info prompt before generating', () => {
    render(<RandomNumberGenerator />)
    expect(screen.getByText(/configure the options/i)).toBeInTheDocument()
  })

  it('generates 1 number in [1, 6]', () => {
    setup('1', '6', '1')
    // The large single-number display
    const display = document.querySelector('div[style*="3rem"]') as HTMLElement | null
    expect(display).not.toBeNull()
    const val = parseInt(display!.textContent ?? '-1')
    expect(val).toBeGreaterThanOrEqual(1)
    expect(val).toBeLessThanOrEqual(6)
  })

  it('generates count 5 unique values within [1, 10]', () => {
    setup('1', '10', '5', true)
    // Multi-number output is comma-separated text
    const resultBlock = document.querySelector('div[style*="pre-wrap"]') as HTMLElement | null
    expect(resultBlock).not.toBeNull()
    const values = resultBlock!.textContent!
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n))
    expect(values.length).toBe(5)
    // All in range
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(10)
    })
    // All unique
    expect(new Set(values).size).toBe(5)
  })

  it('shows error when requesting 5 unique values from [1, 3]', () => {
    setup('1', '3', '5', true)
    expect(screen.getByText(/cannot generate 5 unique/i)).toBeInTheDocument()
  })

  it('shows error when min > max', () => {
    setup('10', '5', '1')
    expect(screen.getByText(/min must be less than/i)).toBeInTheDocument()
  })

  it('shows error when count is 0', () => {
    setup('1', '100', '0')
    expect(screen.getByText(/count must be at least 1/i)).toBeInTheDocument()
  })

  it('generates multiple numbers in comma-separated format by default', () => {
    setup('1', '100', '3')
    const resultBlock = document.querySelector('div[style*="pre-wrap"]') as HTMLElement | null
    expect(resultBlock).not.toBeNull()
    const values = resultBlock!.textContent!
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n))
    expect(values.length).toBe(3)
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(100)
    })
  })

  it('renders the count and range footer text', () => {
    setup('1', '6', '1')
    expect(screen.getByText(/1 number/i)).toBeInTheDocument()
  })
})
