import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoremIpsum from '@/components/tools/LoremIpsum'

const CLASSIC_START = 'Lorem ipsum dolor sit amet'

function getOutput(): HTMLTextAreaElement {
  return screen.getByPlaceholderText('Press Generate to create text…') as HTMLTextAreaElement
}

function getCountInput(): HTMLInputElement {
  return screen.getByRole('spinbutton') as HTMLInputElement
}

describe('LoremIpsum', () => {
  it('renders with output pre-populated on mount (default 3 paragraphs)', () => {
    render(<LoremIpsum />)
    const output = getOutput()
    expect(output.value.trim().length).toBeGreaterThan(0)
  })

  it('default output starts with "Lorem ipsum" (classic start enabled by default)', () => {
    render(<LoremIpsum />)
    const output = getOutput()
    expect(output.value).toContain(CLASSIC_START)
  })

  it('default output has 3 paragraphs (separated by double newline)', () => {
    render(<LoremIpsum />)
    const output = getOutput()
    const paragraphs = output.value.split('\n\n').filter(Boolean)
    expect(paragraphs.length).toBe(3)
  })

  it('generates new output when Generate button is clicked', () => {
    render(<LoremIpsum />)
    const before = getOutput().value
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    // Output should still be non-empty (may or may not differ, but must be present)
    expect(getOutput().value.trim().length).toBeGreaterThan(0)
    // Click was handled without error
    expect(screen.getByRole('button', { name: /generate/i })).not.toBeDisabled()
    // Suppress unused var warning — we just needed to call getOutput before.
    void before
  })

  it('generates 1 paragraph when count is set to 1', () => {
    render(<LoremIpsum />)
    const countInput = getCountInput()
    fireEvent.change(countInput, { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    const output = getOutput()
    // 1 paragraph: no double newline separators
    const paragraphs = output.value.split('\n\n').filter(Boolean)
    expect(paragraphs.length).toBe(1)
    expect(output.value.trim().length).toBeGreaterThan(0)
  })

  it('generates 5 paragraphs when count is set to 5', () => {
    render(<LoremIpsum />)
    const countInput = getCountInput()
    fireEvent.change(countInput, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    const output = getOutput()
    const paragraphs = output.value.split('\n\n').filter(Boolean)
    expect(paragraphs.length).toBe(5)
  })

  it('generates sentences mode: output has no double newlines, ends with period', () => {
    render(<LoremIpsum />)
    fireEvent.click(screen.getByRole('tab', { name: 'Sentences' }))
    fireEvent.change(getCountInput(), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    const output = getOutput()
    expect(output.value.trim().length).toBeGreaterThan(0)
    // Should end with a period
    expect(output.value.trim()).toMatch(/\.$/)
    // No double newlines in sentences mode
    expect(output.value).not.toContain('\n\n')
  })

  it('generates sentences starting with "Lorem ipsum…" when classic toggle is on (default)', () => {
    render(<LoremIpsum />)
    fireEvent.click(screen.getByRole('tab', { name: 'Sentences' }))
    // classic is on by default — just click Generate
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    expect(getOutput().value).toContain(CLASSIC_START)
  })

  it('generates words mode: output has roughly the right word count', () => {
    render(<LoremIpsum />)
    fireEvent.click(screen.getByRole('tab', { name: 'Words' }))
    fireEvent.change(getCountInput(), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    const output = getOutput()
    const words = output.value.trim().split(/\s+/).filter(Boolean)
    expect(words.length).toBe(20)
  })

  it('generates words starting with "Lorem ipsum" when classic is on', () => {
    render(<LoremIpsum />)
    fireEvent.click(screen.getByRole('tab', { name: 'Words' }))
    fireEvent.change(getCountInput(), { target: { value: '10' } })
    // classic is on by default
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    const output = getOutput()
    // First word should be "lorem" (classic start extracts lowercase words)
    expect(output.value.toLowerCase()).toMatch(/^lorem/)
  })

  it('disabling "Start with Lorem ipsum" toggle still produces valid output', () => {
    render(<LoremIpsum />)
    // The Toggle renders a <label> wrapping a checkbox + text span.
    // Use getByRole('checkbox') since there's only one checkbox on the component.
    const toggle = screen.getByRole('checkbox')
    // Default is checked (classic=true), uncheck it
    fireEvent.click(toggle)
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    const output = getOutput()
    expect(output.value.trim().length).toBeGreaterThan(0)
    // Just verify output is valid text
    expect(output.value.trim()).toMatch(/\w+/)
  })

  it('shows error notice for invalid count (0)', () => {
    render(<LoremIpsum />)
    fireEvent.change(getCountInput(), { target: { value: '0' } })
    expect(screen.getByText(/Enter a whole number ≥ 1/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate/i })).toBeDisabled()
  })

  it('shows error notice for non-numeric count', () => {
    render(<LoremIpsum />)
    fireEvent.change(getCountInput(), { target: { value: 'abc' } })
    expect(screen.getByText(/Enter a whole number ≥ 1/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate/i })).toBeDisabled()
  })

  it('Generate button is enabled for valid count', () => {
    render(<LoremIpsum />)
    expect(screen.getByRole('button', { name: /generate/i })).not.toBeDisabled()
  })
})
