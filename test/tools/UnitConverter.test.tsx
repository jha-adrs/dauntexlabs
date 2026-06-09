import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UnitConverter from '@/components/tools/UnitConverter'

// Helper: find the combobox (select element) by its current visible value
function getComboboxes() {
  return screen.getAllByRole('combobox')
}

describe('UnitConverter', () => {
  it('renders with default category Length and shows initial units', () => {
    render(<UnitConverter />)
    // Category combobox defaults to Length
    const combos = getComboboxes()
    expect(combos[0]).toHaveValue('Length')
    // Default from unit is 'm', to unit is 'km'
    expect(combos[1]).toHaveValue('m')
    expect(combos[2]).toHaveValue('km')
  })

  it('converts 1 m to 0.001 km (default state)', () => {
    render(<UnitConverter />)
    // Default value is 1, from=m, to=km
    // 1 m = 0.001 km
    expect(screen.getByText('0.001')).toBeInTheDocument()
  })

  it('converts 1000 m to 1 km', () => {
    render(<UnitConverter />)
    const combos = getComboboxes()
    // category=Length (index 0), from=m (index 1), to=km (index 2)
    const valueInput = screen.getByDisplayValue('1')
    fireEvent.change(valueInput, { target: { value: '1000' } })
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('converts 1 km to 1000 m', () => {
    render(<UnitConverter />)
    const combos = getComboboxes()
    // Change "from" to km, "to" to m
    fireEvent.change(combos[1], { target: { value: 'km' } })
    fireEvent.change(combos[2], { target: { value: 'm' } })
    // value input now has "1"
    expect(screen.getByText('1000')).toBeInTheDocument()
  })

  it('shows ratio label "1 km = 1000 m"', () => {
    render(<UnitConverter />)
    const combos = getComboboxes()
    fireEvent.change(combos[1], { target: { value: 'km' } })
    fireEvent.change(combos[2], { target: { value: 'm' } })
    expect(screen.getByText('1 km = 1000 m')).toBeInTheDocument()
  })

  it('switches to Temperature and converts 0°C to 32°F', () => {
    render(<UnitConverter />)
    const combos = getComboboxes()
    // Switch category to Temperature
    fireEvent.change(combos[0], { target: { value: 'Temperature' } })
    // After switching, tempFrom=C, tempTo=F (defaults)
    const refreshedCombos = getComboboxes()
    expect(refreshedCombos[1]).toHaveValue('C')
    expect(refreshedCombos[2]).toHaveValue('F')
    // Change value to 0
    const valueInput = screen.getByDisplayValue('1')
    fireEvent.change(valueInput, { target: { value: '0' } })
    // 0°C = 32°F
    expect(screen.getByText('32')).toBeInTheDocument()
  })

  it('shows an error for non-numeric input', () => {
    render(<UnitConverter />)
    // The value input has type=number; to simulate a non-numeric string bypassing
    // the browser constraint, directly set value to 'xyz' via the input event
    // and trigger change (jsdom does allow arbitrary strings on number inputs in tests)
    const valueInput = screen.getByDisplayValue('1') as HTMLInputElement
    // Directly mutate the value and fire the event
    Object.defineProperty(valueInput, 'value', { writable: true, configurable: true, value: 'xyz' })
    fireEvent.change(valueInput, { target: { value: 'xyz' } })
    expect(screen.getByText('Enter a valid number.')).toBeInTheDocument()
  })

  it('shows empty result for empty input', () => {
    render(<UnitConverter />)
    const valueInput = screen.getByDisplayValue('1')
    fireEvent.change(valueInput, { target: { value: '' } })
    // Result area shows the dash placeholder, not a number
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('converts Data units: 1 KB = 1024 B', () => {
    render(<UnitConverter />)
    const combos = getComboboxes()
    fireEvent.change(combos[0], { target: { value: 'Data' } })
    const refreshedCombos = getComboboxes()
    // First unit is B, second is KB
    fireEvent.change(refreshedCombos[1], { target: { value: 'KB' } })
    fireEvent.change(refreshedCombos[2], { target: { value: 'B' } })
    const valueInput = screen.getByDisplayValue('1')
    fireEvent.change(valueInput, { target: { value: '1' } })
    expect(screen.getByText('1024')).toBeInTheDocument()
  })
})
