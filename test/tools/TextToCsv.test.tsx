import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TextToCsv from '@/components/tools/TextToCsv'

describe('TextToCsv', () => {
  it('splits whitespace-delimited text into CSV columns by default', () => {
    render(<TextToCsv />)
    fireEvent.change(screen.getByPlaceholderText('Paste freeform text here (one row per line)…'), {
      target: { value: 'Alice 30 Paris\nBob 25 London' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('Alice,30,Paris')
    expect(lines[1]).toBe('Bob,25,London')
  })

  it('splits comma-delimited input when comma delimiter is selected', () => {
    render(<TextToCsv />)
    const sel = screen.getByRole('combobox')
    fireEvent.change(sel, { target: { value: ',' } })
    fireEvent.change(screen.getByPlaceholderText('Paste freeform text here (one row per line)…'), {
      target: { value: 'Alice,30,Paris\nBob,25,London' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('Alice,30,Paris')
    expect(lines[1]).toBe('Bob,25,London')
  })

  it('splits semicolon-delimited input when semicolon delimiter is selected', () => {
    render(<TextToCsv />)
    const sel = screen.getByRole('combobox')
    fireEvent.change(sel, { target: { value: ';' } })
    fireEvent.change(screen.getByPlaceholderText('Paste freeform text here (one row per line)…'), {
      target: { value: 'Alice;30;Paris' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    expect(out.value).toBe('Alice,30,Paris')
  })

  it('quotes all fields when Quote all fields toggle is enabled', () => {
    render(<TextToCsv />)
    fireEvent.click(screen.getByLabelText('Quote all fields'))
    fireEvent.change(screen.getByPlaceholderText('Paste freeform text here (one row per line)…'), {
      target: { value: 'Alice 30' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    expect(out.value).toBe('"Alice","30"')
  })

  it('shows error when custom delimiter is selected but not specified', () => {
    render(<TextToCsv />)
    const sel = screen.getByRole('combobox')
    fireEvent.change(sel, { target: { value: 'custom' } })
    fireEvent.change(screen.getByPlaceholderText('Paste freeform text here (one row per line)…'), {
      target: { value: 'Alice|30' },
    })
    expect(screen.getByText(/Enter a custom delimiter/i)).toBeInTheDocument()
  })

  it('uses a custom delimiter when specified', () => {
    render(<TextToCsv />)
    const sel = screen.getByRole('combobox')
    fireEvent.change(sel, { target: { value: 'custom' } })
    // fill in the custom delimiter text input
    // The input is the only input element visible (Field wraps with <label>)
    const customInput = document.querySelector('input[type="text"]') as HTMLInputElement
    fireEvent.change(customInput, { target: { value: '|' } })
    fireEvent.change(screen.getByPlaceholderText('Paste freeform text here (one row per line)…'), {
      target: { value: 'Alice|30|Paris' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    expect(out.value).toBe('Alice,30,Paris')
  })

  it('drops trailing blank lines from output', () => {
    render(<TextToCsv />)
    fireEvent.change(screen.getByPlaceholderText('Paste freeform text here (one row per line)…'), {
      target: { value: 'Alice 30\n\n\n' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    // trailing blank lines should be removed
    expect(out.value.endsWith('\n')).toBe(false)
    expect(out.value.split('\n').filter(Boolean)).toHaveLength(1)
  })

  it('returns empty output for empty input', () => {
    render(<TextToCsv />)
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    expect(out.value).toBe('')
  })
})
