import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TimestampConverter from '@/components/tools/TimestampConverter'

describe('TimestampConverter — Unix → Date', () => {
  it('renders in Unix→Date mode by default', () => {
    render(<TimestampConverter />)
    // "Unix → Date" appears in tab + panel title — just check the input placeholder
    expect(screen.getByPlaceholderText(/1700000000/)).toBeInTheDocument()
    // Panel title is "Unix → Date" (multiple elements with that text is OK)
    expect(screen.getAllByText('Unix → Date').length).toBeGreaterThanOrEqual(1)
  })

  it('converts timestamp 0 (Unix epoch) to the correct ISO date', () => {
    render(<TimestampConverter />)
    const input = screen.getByPlaceholderText(/1700000000/)
    fireEvent.change(input, { target: { value: '0' } })
    // The ISO row should show 1970-01-01T00:00:00.000Z
    expect(screen.getByText('1970-01-01T00:00:00.000Z')).toBeInTheDocument()
  })

  it('converts seconds timestamp 1700000000 to ISO 2023-11-14', () => {
    render(<TimestampConverter />)
    const input = screen.getByPlaceholderText(/1700000000/)
    // Set unit to seconds explicitly
    const unitSelect = screen.getByRole('combobox')
    fireEvent.change(unitSelect, { target: { value: 's' } })
    fireEvent.change(input, { target: { value: '1700000000' } })
    // 1700000000 seconds = 2023-11-14T22:13:20.000Z
    expect(screen.getByText('2023-11-14T22:13:20.000Z')).toBeInTheDocument()
  })

  it('auto-detects milliseconds for 13-digit timestamp', () => {
    render(<TimestampConverter />)
    const input = screen.getByPlaceholderText(/1700000000/)
    // 1700000000000 ms = 2023-11-14T22:13:20.000Z (same instant)
    fireEvent.change(input, { target: { value: '1700000000000' } })
    expect(screen.getByText('2023-11-14T22:13:20.000Z')).toBeInTheDocument()
  })

  it('shows an error for non-numeric input', () => {
    render(<TimestampConverter />)
    const input = screen.getByPlaceholderText(/1700000000/)
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(screen.getByText('Not a valid number.')).toBeInTheDocument()
  })

  it('shows UTC, Local, ISO 8601, RFC 2822, and Relative rows', () => {
    render(<TimestampConverter />)
    const input = screen.getByPlaceholderText(/1700000000/)
    fireEvent.change(input, { target: { value: '0' } })
    expect(screen.getByText('UTC')).toBeInTheDocument()
    expect(screen.getByText('Local')).toBeInTheDocument()
    expect(screen.getByText('ISO 8601')).toBeInTheDocument()
    expect(screen.getByText('RFC 2822')).toBeInTheDocument()
    expect(screen.getByText('Relative')).toBeInTheDocument()
  })

  it('Now button fills in current ms timestamp', () => {
    render(<TimestampConverter />)
    fireEvent.click(screen.getByRole('button', { name: /Now/i }))
    const input = screen.getByPlaceholderText(/1700000000/) as HTMLInputElement
    expect(input.value).not.toBe('')
    expect(Number(input.value)).toBeGreaterThan(1_000_000_000_000)
  })
})

describe('TimestampConverter — Date → Unix', () => {
  function switchToDateToUnix() {
    render(<TimestampConverter />)
    fireEvent.click(screen.getByRole('tab', { name: 'Date → Unix' }))
  }

  it('switches to Date→Unix mode via tab', () => {
    switchToDateToUnix()
    // "Date → Unix" appears in both the tab + panel title
    expect(screen.getAllByText('Date → Unix').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByPlaceholderText(/2024-11-14/)).toBeInTheDocument()
  })

  it('converts ISO date 1970-01-01T00:00:00Z to unix 0', () => {
    switchToDateToUnix()
    const input = screen.getByPlaceholderText(/2024-11-14/)
    fireEvent.change(input, { target: { value: '1970-01-01T00:00:00Z' } })
    // Both seconds and milliseconds rows show "0" — at least 2 occurrences
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(2)
  })

  it('converts 2023-11-14T22:13:20.000Z to 1700000000 seconds', () => {
    switchToDateToUnix()
    const input = screen.getByPlaceholderText(/2024-11-14/)
    fireEvent.change(input, { target: { value: '2023-11-14T22:13:20.000Z' } })
    expect(screen.getByText('1700000000')).toBeInTheDocument()
    expect(screen.getByText('1700000000000')).toBeInTheDocument()
  })

  it('shows an error for unparseable date string', () => {
    switchToDateToUnix()
    const input = screen.getByPlaceholderText(/2024-11-14/)
    fireEvent.change(input, { target: { value: 'not a date' } })
    expect(screen.getByText(/Cannot parse this date string/i)).toBeInTheDocument()
  })

  it('Now button fills in current ISO timestamp', () => {
    switchToDateToUnix()
    fireEvent.click(screen.getByRole('button', { name: /Now/i }))
    const input = screen.getByPlaceholderText(/2024-11-14/) as HTMLInputElement
    expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
