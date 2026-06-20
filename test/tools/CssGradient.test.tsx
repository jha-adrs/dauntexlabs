import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CssGradient from '@/components/tools/CssGradient'

// Helper: get the CSS output text
function getCssOutput() {
  // The CSS output is inside a div with font-mono style, contains "background:"
  return (document.body.textContent ?? '').match(/background:[^;]+;/)?.[0] ?? ''
}

describe('CssGradient', () => {
  it('renders a linear-gradient by default', () => {
    render(<CssGradient />)
    const css = getCssOutput()
    expect(css).toContain('linear-gradient(')
  })

  it('includes both default stop colors in the output', () => {
    render(<CssGradient />)
    const css = getCssOutput()
    // Default stops are #c6f24e and #1a1a2e
    expect(css).toContain('#c6f24e')
    expect(css).toContain('#1a1a2e')
  })

  it('includes the angle in linear mode', () => {
    render(<CssGradient />)
    const css = getCssOutput()
    expect(css).toContain('deg')
  })

  it('switches to radial-gradient on Radial tab', () => {
    render(<CssGradient />)
    fireEvent.click(screen.getByRole('tab', { name: 'Radial' }))
    const css = getCssOutput()
    expect(css).toContain('radial-gradient(')
  })

  it('does NOT include angle in radial mode', () => {
    render(<CssGradient />)
    fireEvent.click(screen.getByRole('tab', { name: 'Radial' }))
    const css = getCssOutput()
    expect(css).not.toContain('deg')
  })

  it('angle slider changes the CSS angle value', () => {
    render(<CssGradient />)
    const slider = screen.getByLabelText('Gradient angle')
    fireEvent.change(slider, { target: { value: '45' } })
    const css = getCssOutput()
    expect(css).toContain('45deg')
  })

  it('includes stop positions in output', () => {
    render(<CssGradient />)
    const css = getCssOutput()
    expect(css).toContain('0%')
    expect(css).toContain('100%')
  })

  it('position inputs change the CSS output', () => {
    render(<CssGradient />)
    const posInputs = screen.getAllByPlaceholderText(/\d+%/)
    fireEvent.change(posInputs[0], { target: { value: '25%' } })
    const css = getCssOutput()
    expect(css).toContain('25%')
  })

  it('renders a CopyButton', () => {
    render(<CssGradient />)
    expect(screen.getByText('copy')).toBeInTheDocument()
  })

  it('switches back to Linear tab from Radial', () => {
    render(<CssGradient />)
    fireEvent.click(screen.getByRole('tab', { name: 'Radial' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Linear' }))
    const css = getCssOutput()
    expect(css).toContain('linear-gradient(')
  })
})
