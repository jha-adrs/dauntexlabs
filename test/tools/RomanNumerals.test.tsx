import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RomanNumerals from '@/components/tools/RomanNumerals'

describe('RomanNumerals', () => {
  // Helpers for both modes
  function toRomanInput() {
    return screen.getByPlaceholderText('Enter a number (1–3999)…')
  }
  function fromRomanInput() {
    return screen.getByPlaceholderText('Enter a Roman numeral…')
  }
  function getOutput() {
    // The output is rendered in a div with a style containing --acid color
    // querySelector with partial style match for the var(--acid) reference
    const el = document.querySelector('[style*="--acid"]') as HTMLElement | null
    return el?.textContent ?? ''
  }

  it('converts 2024 to MMXXIV', () => {
    render(<RomanNumerals />)
    fireEvent.change(toRomanInput(), { target: { value: '2024' } })
    expect(getOutput()).toBe('MMXXIV')
  })

  it('converts 1 to I', () => {
    render(<RomanNumerals />)
    fireEvent.change(toRomanInput(), { target: { value: '1' } })
    expect(getOutput()).toBe('I')
  })

  it('converts 3999 to MMMCMXCIX', () => {
    render(<RomanNumerals />)
    fireEvent.change(toRomanInput(), { target: { value: '3999' } })
    expect(getOutput()).toBe('MMMCMXCIX')
  })

  it('converts 4 to IV', () => {
    render(<RomanNumerals />)
    fireEvent.change(toRomanInput(), { target: { value: '4' } })
    expect(getOutput()).toBe('IV')
  })

  it('converts 9 to IX', () => {
    render(<RomanNumerals />)
    fireEvent.change(toRomanInput(), { target: { value: '9' } })
    expect(getOutput()).toBe('IX')
  })

  it('shows error for 4000 (out of range)', () => {
    render(<RomanNumerals />)
    fireEvent.change(toRomanInput(), { target: { value: '4000' } })
    expect(screen.getByText(/1 and 3999|between/i)).toBeInTheDocument()
  })

  it('shows error for 0', () => {
    render(<RomanNumerals />)
    fireEvent.change(toRomanInput(), { target: { value: '0' } })
    expect(screen.getByText(/1 and 3999|between/i)).toBeInTheDocument()
  })

  it('shows error for negative numbers', () => {
    render(<RomanNumerals />)
    fireEvent.change(toRomanInput(), { target: { value: '-5' } })
    expect(screen.getByText(/1 and 3999|between|valid/i)).toBeInTheDocument()
  })

  it('converts MCMXCIV to 1994', () => {
    render(<RomanNumerals />)
    fireEvent.click(screen.getByRole('tab', { name: 'Roman → Number' }))
    fireEvent.change(fromRomanInput(), { target: { value: 'MCMXCIV' } })
    expect(getOutput()).toBe('1994')
  })

  it('converts XIV to 14', () => {
    render(<RomanNumerals />)
    fireEvent.click(screen.getByRole('tab', { name: 'Roman → Number' }))
    fireEvent.change(fromRomanInput(), { target: { value: 'XIV' } })
    expect(getOutput()).toBe('14')
  })

  it('converts III to 3', () => {
    render(<RomanNumerals />)
    fireEvent.click(screen.getByRole('tab', { name: 'Roman → Number' }))
    fireEvent.change(fromRomanInput(), { target: { value: 'III' } })
    expect(getOutput()).toBe('3')
  })

  it('accepts lowercase roman numerals', () => {
    render(<RomanNumerals />)
    fireEvent.click(screen.getByRole('tab', { name: 'Roman → Number' }))
    fireEvent.change(fromRomanInput(), { target: { value: 'xiv' } })
    expect(getOutput()).toBe('14')
  })

  it('shows error for malformed Roman numeral IIII', () => {
    render(<RomanNumerals />)
    fireEvent.click(screen.getByRole('tab', { name: 'Roman → Number' }))
    fireEvent.change(fromRomanInput(), { target: { value: 'IIII' } })
    expect(screen.getByText(/not a valid/i)).toBeInTheDocument()
  })

  it('shows error for invalid Roman numeral characters', () => {
    render(<RomanNumerals />)
    fireEvent.click(screen.getByRole('tab', { name: 'Roman → Number' }))
    fireEvent.change(fromRomanInput(), { target: { value: 'ABC' } })
    expect(screen.getByText(/not a valid/i)).toBeInTheDocument()
  })

  it('empty input produces no output and no error', () => {
    render(<RomanNumerals />)
    fireEvent.change(toRomanInput(), { target: { value: '' } })
    expect(screen.queryByText(/error|invalid/i)).not.toBeInTheDocument()
  })
})
