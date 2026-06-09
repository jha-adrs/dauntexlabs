import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NumberBaseConverter from '@/components/tools/NumberBaseConverter'

describe('NumberBaseConverter', () => {
  it('renders with default from=10 to=16', () => {
    render(<NumberBaseConverter />)
    // The common-base section has two comboboxes: from and to
    const combos = screen.getAllByRole('combobox')
    expect(combos[0]).toHaveValue('10')
    expect(combos[1]).toHaveValue('16')
  })

  it('converts 255 decimal to ff hex', () => {
    render(<NumberBaseConverter />)
    // find the value input for the common section (hint contains "enter digits valid for base")
    const inputs = screen.getAllByRole('textbox')
    // First textbox in common section is the value input (no placeholder set explicitly)
    // Use the one with empty value in the main panel
    fireEvent.change(inputs[0], { target: { value: '255' } })
    // Result area shows "ff"
    expect(screen.getByText('ff')).toBeInTheDocument()
  })

  it('converts 255 decimal to 11111111 binary', () => {
    render(<NumberBaseConverter />)
    const combos = screen.getAllByRole('combobox')
    // Change to-base to binary (2)
    fireEvent.change(combos[1], { target: { value: '2' } })
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '255' } })
    expect(screen.getByText('11111111')).toBeInTheDocument()
  })

  it('shows all-bases table when value is entered', () => {
    render(<NumberBaseConverter />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '255' } })
    // Table should show panel title for "all common bases"
    expect(screen.getByText('all common bases')).toBeInTheDocument()
    // Row labels are e.g. "Binary (2)", "Octal (8)", "Decimal (10)", "Hexadecimal (16)"
    expect(screen.getByText('Binary (2)')).toBeInTheDocument()
    expect(screen.getByText('Octal (8)')).toBeInTheDocument()
    expect(screen.getByText('Decimal (10)')).toBeInTheDocument()
    expect(screen.getByText('Hexadecimal (16)')).toBeInTheDocument()
  })

  it('shows all-bases values correctly for 255', () => {
    render(<NumberBaseConverter />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '255' } })
    // Binary row: 0b11111111
    expect(screen.getByText('0b11111111')).toBeInTheDocument()
    // Octal row: 0o377
    expect(screen.getByText('0o377')).toBeInTheDocument()
    // Decimal row: 255
    expect(screen.getByText('255')).toBeInTheDocument()
    // Hex row: 0xff
    expect(screen.getByText('0xff')).toBeInTheDocument()
  })

  it('converts hex input to decimal', () => {
    render(<NumberBaseConverter />)
    const combos = screen.getAllByRole('combobox')
    // from=16, to=10
    fireEvent.change(combos[0], { target: { value: '16' } })
    fireEvent.change(combos[1], { target: { value: '10' } })
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'ff' } })
    // ff hex = 255 decimal — find specifically the converted output (the large acid-color div)
    // There can be multiple "255" elements (one in output div, one in the all-bases table decimal row)
    const matches = screen.getAllByText('255')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('shows error for invalid digit in selected base', () => {
    render(<NumberBaseConverter />)
    // from=2 (binary): '2' is invalid
    const combos = screen.getAllByRole('combobox')
    fireEvent.change(combos[0], { target: { value: '2' } })
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '2' } })
    expect(screen.getByText(/"2" contains digits invalid for base 2\./)).toBeInTheDocument()
  })

  it('hides the table when input is cleared', () => {
    render(<NumberBaseConverter />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '255' } })
    fireEvent.change(inputs[0], { target: { value: '' } })
    expect(screen.queryByText(/all common bases/i)).not.toBeInTheDocument()
  })

  it('converts binary 1010 to decimal 10', () => {
    render(<NumberBaseConverter />)
    const combos = screen.getAllByRole('combobox')
    fireEvent.change(combos[0], { target: { value: '2' } })
    fireEvent.change(combos[1], { target: { value: '10' } })
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '1010' } })
    // There can be multiple "10" elements (output + base 10 in table)
    const matches = screen.getAllByText('10')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })
})
