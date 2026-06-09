import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JsonFormatter from '@/components/tools/JsonFormatter'

// The output panel renders a readOnly <textarea> with this placeholder.
const OUT = 'Formatted JSON will appear here…'
const IN = 'Paste JSON here…'

function outValue() {
  return (screen.getByPlaceholderText(OUT) as HTMLTextAreaElement).value
}

describe('JsonFormatter', () => {
  it('beautifies a known object with 2-space indentation (default mode)', () => {
    render(<JsonFormatter />)
    fireEvent.change(screen.getByPlaceholderText(IN), {
      target: { value: '{"b":1,"a":[1,2]}' },
    })
    const out = outValue()
    // Pretty-printed: newlines + 2-space indent on nested keys.
    expect(out).toContain('\n')
    expect(out).toContain('"b": 1')
    expect(out).toContain('  "b": 1') // 2-space indent
    expect(out).toMatch(/\[\n {4}1,\n {4}2\n {2}\]/) // array elements at 4 spaces
  })

  it('respects a 4-space indent selection', () => {
    render(<JsonFormatter />)
    fireEvent.change(screen.getByPlaceholderText(IN), {
      target: { value: '{"a":1}' },
    })
    // Indent <Select> is the only combobox in the toolbar.
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '4' } })
    expect(outValue()).toContain('    "a": 1') // four spaces
  })

  it('minifies to a single line', () => {
    render(<JsonFormatter />)
    fireEvent.click(screen.getByRole('tab', { name: 'Minify' }))
    fireEvent.change(screen.getByPlaceholderText(IN), {
      target: { value: '{\n  "a": 1,\n  "b": 2\n}' },
    })
    const out = outValue()
    expect(out).toBe('{"a":1,"b":2}')
    expect(out).not.toContain('\n')
  })

  it('sorts keys when "Sort keys" is toggled', () => {
    render(<JsonFormatter />)
    fireEvent.click(screen.getByRole('tab', { name: 'Minify' }))
    fireEvent.click(screen.getByLabelText('Sort keys'))
    fireEvent.change(screen.getByPlaceholderText(IN), {
      target: { value: '{"b":1,"a":2}' },
    })
    expect(outValue()).toBe('{"a":2,"b":1}')
  })

  it('reports valid JSON in Validate mode', () => {
    render(<JsonFormatter />)
    fireEvent.click(screen.getByRole('tab', { name: 'Validate' }))
    fireEvent.change(screen.getByPlaceholderText(IN), {
      target: { value: '{"ok":true}' },
    })
    expect(screen.getByText('Valid JSON')).toBeInTheDocument()
  })

  it('flags invalid JSON with an error in Validate mode', () => {
    render(<JsonFormatter />)
    fireEvent.click(screen.getByRole('tab', { name: 'Validate' }))
    fireEvent.change(screen.getByPlaceholderText(IN), {
      target: { value: '{ not: valid json' },
    })
    // No success notice; an error notice appears instead.
    expect(screen.queryByText('Valid JSON')).not.toBeInTheDocument()
    expect(document.querySelector('.notice.error')).toBeInTheDocument()
  })

  it('flags invalid JSON with an error in Beautify mode', () => {
    render(<JsonFormatter />)
    fireEvent.change(screen.getByPlaceholderText(IN), {
      target: { value: '{"a": }' },
    })
    expect(document.querySelector('.notice.error')).toBeInTheDocument()
    // Output textarea is not rendered while erroring.
    expect(screen.queryByPlaceholderText(OUT)).not.toBeInTheDocument()
  })

  it('accepts a loose JS object literal when the loose toggle is on', () => {
    render(<JsonFormatter />)
    // Strict mode would reject this input.
    const loose = "{a:1,/*c*/ b:'x',}"
    fireEvent.change(screen.getByPlaceholderText(IN), { target: { value: loose } })
    // Strict: error, no output.
    expect(document.querySelector('.notice.error')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Parse JS objects (loose)'))
    // The placeholder changes to the loose hint once the toggle flips.
    const looseInput = screen.getByPlaceholderText(/loose JS object/i) as HTMLTextAreaElement
    // value persisted across the toggle.
    expect(looseInput.value).toBe(loose)
    const out = outValue()
    // Yields canonical, valid JSON.
    expect(JSON.parse(out)).toEqual({ a: 1, b: 'x' })
    expect(out).toContain('"a": 1')
    expect(out).toContain('"b": "x"')
  })
})
