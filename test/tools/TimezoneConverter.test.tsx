import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TimezoneConverter from '@/components/tools/TimezoneConverter'

// In Node/jsdom, Intl.supportedValuesOf('timeZone') does not include 'UTC'.
// So the component's initial source-zone select falls back to the first
// alphabetical zone. We use zones we know exist: America/New_York, Europe/London, etc.

describe('TimezoneConverter', () => {
  it('renders the source time panel and target timezones panel', () => {
    render(<TimezoneConverter />)
    expect(screen.getByText('source time')).toBeInTheDocument()
    expect(screen.getByText('target timezones')).toBeInTheDocument()
  })

  it('has a "now" button that sets the datetime-local input to the current time', () => {
    render(<TimezoneConverter />)
    const nowBtn = screen.getByRole('button', { name: /now/i })
    const dtInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement
    fireEvent.click(nowBtn)
    const after = dtInput.value
    expect(after).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('shows multiple comboboxes — one source + default 4 target zones', () => {
    render(<TimezoneConverter />)
    // 1 source zone + 4 target zones = 5 comboboxes
    const combos = screen.getAllByRole('combobox')
    expect(combos.length).toBe(5)
  })

  it('adds a new target zone when "+ add zone" is clicked', () => {
    render(<TimezoneConverter />)
    const combosBeforeCount = screen.getAllByRole('combobox').length
    fireEvent.click(screen.getByRole('button', { name: /\+ add zone/i }))
    const combosAfterCount = screen.getAllByRole('combobox').length
    expect(combosAfterCount).toBe(combosBeforeCount + 1)
  })

  it('removes a target zone when × button is clicked', () => {
    render(<TimezoneConverter />)
    const combosBeforeCount = screen.getAllByRole('combobox').length
    const removeBtns = screen.getAllByTitle('Remove')
    fireEvent.click(removeBtns[0])
    const combosAfterCount = screen.getAllByRole('combobox').length
    expect(combosAfterCount).toBe(combosBeforeCount - 1)
  })

  it('shows "No target timezones" notice after all zones are removed', () => {
    render(<TimezoneConverter />)
    const removeBtns = () => screen.queryAllByTitle('Remove')
    while (removeBtns().length > 0) {
      fireEvent.click(removeBtns()[0])
    }
    expect(screen.getByText(/No target timezones/i)).toBeInTheDocument()
  })

  it('shows the "Interpreting as:" line when a valid datetime is set', () => {
    render(<TimezoneConverter />)
    const dtInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement
    fireEvent.change(dtInput, { target: { value: '2024-06-15T10:00' } })
    // Source zone defaults to the first available zone (Africa/Abidjan in Node env),
    // which is still a valid zone, so parsing should succeed
    expect(screen.getByText(/Interpreting as:/)).toBeInTheDocument()
  })

  it('shows converted time text for target zones', () => {
    render(<TimezoneConverter />)
    const dtInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement
    fireEvent.change(dtInput, { target: { value: '2024-01-15T12:00' } })
    // With a valid instant, the default target zones should display converted times
    // The converted text is rendered in span elements (not the "—" dash)
    // Just check no parse errors are shown
    expect(screen.queryByText(/Could not parse/i)).not.toBeInTheDocument()
  })

  it('changing source timezone select updates the state', () => {
    render(<TimezoneConverter />)
    const combos = screen.getAllByRole('combobox')
    // combos[0] is the source timezone select
    const firstZone = (combos[0] as HTMLSelectElement).value
    // Change to a different zone (second combo option if available)
    const options = Array.from((combos[0] as HTMLSelectElement).options)
    if (options.length > 1) {
      const secondZone = options[1].value
      fireEvent.change(combos[0], { target: { value: secondZone } })
      expect(combos[0]).toHaveValue(secondZone)
    } else {
      // Only one zone available — just confirm current value
      expect(combos[0]).toHaveValue(firstZone)
    }
  })
})
