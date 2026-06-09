import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CodeFormatter from '@/components/tools/CodeFormatter'

// Source placeholder depends on the selected language; output is fixed.
const OUT = 'Formatted code will appear here…'

function sourceArea() {
  // The source TextArea placeholder always starts with "Paste ".
  return screen.getByPlaceholderText(/^Paste .* here…$/) as HTMLTextAreaElement
}
function outValue() {
  return (screen.getByPlaceholderText(OUT) as HTMLTextAreaElement).value
}
function setLang(value: string) {
  // Two comboboxes in the toolbar: Language (first) and Indent (second).
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value } })
}

describe('CodeFormatter', () => {
  it('does not crash on empty input (output stays empty)', () => {
    render(<CodeFormatter />)
    expect(outValue()).toBe('')
    expect(document.querySelector('.notice.error')).not.toBeInTheDocument()
  })

  it('beautifies JSON (expands to multiple indented lines)', () => {
    render(<CodeFormatter />) // defaults to JSON + Beautify
    fireEvent.change(sourceArea(), { target: { value: '{"a":1,"b":2}' } })
    const out = outValue()
    expect(out).toContain('\n')
    expect(out).toContain('  "a": 1')
    expect(out.split('\n').length).toBeGreaterThan(1)
  })

  it('minifies JSON to a single line (shrinks)', () => {
    render(<CodeFormatter />)
    const src = '{\n  "a": 1,\n  "b": 2\n}'
    fireEvent.change(sourceArea(), { target: { value: src } })
    const beautified = outValue()
    fireEvent.click(screen.getByRole('tab', { name: 'Minify' }))
    const minified = outValue()
    expect(minified).toBe('{"a":1,"b":2}')
    expect(minified).not.toContain('\n')
    expect(minified.length).toBeLessThan(beautified.length)
  })

  it('reports an error for invalid JSON', () => {
    render(<CodeFormatter />)
    fireEvent.change(sourceArea(), { target: { value: '{not valid' } })
    expect(document.querySelector('.notice.error')).toBeInTheDocument()
    expect(screen.getByText(/Formatting failed/i)).toBeInTheDocument()
  })

  it('beautifies CSS (expands a one-liner across lines)', () => {
    render(<CodeFormatter />)
    setLang('css')
    fireEvent.change(sourceArea(), { target: { value: 'a{color:red;font-size:12px;}' } })
    const out = outValue()
    expect(out).toContain('\n')
    expect(out).toContain('{')
    // Declarations are laid out one per line (verbatim spacing preserved).
    expect(out).toContain('color:red;')
    expect(out).toMatch(/\n {2}color:red;/) // indented under the rule
    // The selector block opens with a brace on the selector line.
    expect(out).toMatch(/a \{/)
    expect(out.split('\n').length).toBeGreaterThan(2)
  })

  it('minifies CSS (shrinks a multi-line rule to one line)', () => {
    render(<CodeFormatter />)
    setLang('css')
    const css = 'a {\n  color: red;\n  font-size: 12px;\n}\n'
    fireEvent.change(sourceArea(), { target: { value: css } })
    const beautified = outValue()
    fireEvent.click(screen.getByRole('tab', { name: 'Minify' }))
    const minified = outValue()
    expect(minified).not.toContain('\n')
    expect(minified).toContain('color:red')
    expect(minified.length).toBeLessThan(beautified.length)
  })

  it('beautifies and minifies JavaScript with consistent round-trip sizing', () => {
    render(<CodeFormatter />)
    setLang('js')
    fireEvent.change(sourceArea(), { target: { value: 'function f(){return 1;}' } })
    const beautified = outValue()
    expect(beautified).toContain('\n') // expanded across lines
    expect(beautified).toContain('{')
    fireEvent.click(screen.getByRole('tab', { name: 'Minify' }))
    const minified = outValue()
    expect(minified).not.toContain('\n')
    expect(minified.length).toBeLessThanOrEqual(beautified.length)
  })

  it('beautifies HTML (indents nested tags)', () => {
    render(<CodeFormatter />)
    setLang('html')
    fireEvent.change(sourceArea(), {
      target: { value: '<div><p>hi</p></div>' },
    })
    const out = outValue()
    expect(out).toContain('\n')
    expect(out).toContain('<div>')
    expect(out).toContain('<p>')
    // The <p> nests under <div>, so it is indented at least 2 spaces.
    expect(out).toMatch(/\n {2,}<p>/)
  })
})
