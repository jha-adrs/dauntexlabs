import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ContrastChecker from '@/components/tools/ContrastChecker'

describe('ContrastChecker', () => {
  it('shows 21.00:1 for black on white', () => {
    render(<ContrastChecker />)
    // Default is #000000 on #ffffff — both valid → result computed
    expect(screen.getByText('21.00:1')).toBeInTheDocument()
  })

  it('passes AA Normal for black on white', () => {
    render(<ContrastChecker />)
    const badge = screen.getByText('AA Normal').closest('div')!
    expect(badge.textContent).toContain('PASS')
  })

  it('passes AA Large for black on white', () => {
    render(<ContrastChecker />)
    const badge = screen.getByText('AA Large').closest('div')!
    expect(badge.textContent).toContain('PASS')
  })

  it('passes AAA Normal for black on white', () => {
    render(<ContrastChecker />)
    const badge = screen.getByText('AAA Normal').closest('div')!
    expect(badge.textContent).toContain('PASS')
  })

  it('passes AAA Large for black on white', () => {
    render(<ContrastChecker />)
    const badge = screen.getByText('AAA Large').closest('div')!
    expect(badge.textContent).toContain('PASS')
  })

  it('accepts #rgb shorthand inputs', () => {
    render(<ContrastChecker />)
    const inputs = screen.getAllByPlaceholderText(/#/)
    // Set fg to #000 (black shorthand), bg stays white
    fireEvent.change(inputs[0], { target: { value: '#000' } })
    expect(screen.getByText('21.00:1')).toBeInTheDocument()
  })

  it('shows an error for invalid foreground hex', () => {
    render(<ContrastChecker />)
    const inputs = screen.getAllByPlaceholderText(/#/)
    fireEvent.change(inputs[0], { target: { value: 'notacolor' } })
    expect(screen.getByText(/invalid/i)).toBeInTheDocument()
  })

  it('shows an error for invalid background hex', () => {
    render(<ContrastChecker />)
    const inputs = screen.getAllByPlaceholderText(/#/)
    fireEvent.change(inputs[1], { target: { value: '#zzzzzz' } })
    expect(screen.getByText(/invalid/i)).toBeInTheDocument()
  })

  it('fails AA Normal for a low-contrast pair like #777 on #888', () => {
    render(<ContrastChecker />)
    const inputs = screen.getAllByPlaceholderText(/#/)
    fireEvent.change(inputs[0], { target: { value: '#777777' } })
    fireEvent.change(inputs[1], { target: { value: '#888888' } })
    const badge = screen.getByText('AA Normal').closest('div')!
    expect(badge.textContent).toContain('FAIL')
  })

  it('ratio is 1.00:1 for identical colors', () => {
    render(<ContrastChecker />)
    const inputs = screen.getAllByPlaceholderText(/#/)
    fireEvent.change(inputs[0], { target: { value: '#aabbcc' } })
    fireEvent.change(inputs[1], { target: { value: '#aabbcc' } })
    expect(screen.getByText('1.00:1')).toBeInTheDocument()
  })
})
