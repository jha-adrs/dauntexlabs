import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StringUtilities from '@/components/tools/StringUtilities'

function getInputArea() {
  return screen.getByPlaceholderText('Enter text…')
}

function getTransformSelect() {
  return screen.getByRole('combobox')
}

// There are two "Result will appear here…" textareas: [0]=transform, [1]=find&replace
function getTransformOutput() {
  return screen.getAllByPlaceholderText('Result will appear here…')[0]
}

function getFROutput() {
  return screen.getAllByPlaceholderText('Result will appear here…')[1]
}

/**
 * Find a stat value by looking for the stat row label, then getting
 * the sibling <code> element's text.
 */
function getStatValue(label: string): string {
  const labelEl = screen.getByText(label)
  const container = labelEl.parentElement!
  const code = container.querySelector('code')
  return code?.textContent ?? ''
}

describe('StringUtilities', () => {
  it('renders with empty state', () => {
    render(<StringUtilities />)
    expect(getInputArea()).toHaveValue('')
    expect(getTransformOutput()).toHaveValue('')
  })

  it('shows stats for a known input', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'hello world' } })
    // characters: 11, words: 2, lines: 1
    expect(getStatValue('Characters')).toBe('11')
    expect(getStatValue('Words')).toBe('2')
    expect(getStatValue('Lines')).toBe('1')
  })

  it('shows correct char count with no spaces stat', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'hi there' } })
    // "hi there" = 8 chars, 7 chars no spaces
    expect(getStatValue('Characters')).toBe('8')
    expect(getStatValue('Chars (no spaces)')).toBe('7')
  })

  it('transforms to UPPERCASE', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'hello world' } })
    // default transform is 'upper'
    expect(getTransformOutput()).toHaveValue('HELLO WORLD')
  })

  it('transforms to lowercase', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'HELLO WORLD' } })
    fireEvent.change(getTransformSelect(), { target: { value: 'lower' } })
    expect(getTransformOutput()).toHaveValue('hello world')
  })

  it('transforms to Title Case', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'hello world' } })
    fireEvent.change(getTransformSelect(), { target: { value: 'title' } })
    expect(getTransformOutput()).toHaveValue('Hello World')
  })

  it('reverses a string', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'abc' } })
    fireEvent.change(getTransformSelect(), { target: { value: 'reverse' } })
    expect(getTransformOutput()).toHaveValue('cba')
  })

  it('slugifies a string', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'Hello World! Test 123' } })
    fireEvent.change(getTransformSelect(), { target: { value: 'slugify' } })
    expect(getTransformOutput()).toHaveValue('hello-world-test-123')
  })

  it('removes duplicate lines', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'a\nb\na\nc\nb' } })
    fireEvent.change(getTransformSelect(), { target: { value: 'dedup-lines' } })
    expect(getTransformOutput()).toHaveValue('a\nb\nc')
  })

  it('sorts lines', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'cherry\napple\nbanana' } })
    fireEvent.change(getTransformSelect(), { target: { value: 'sort-lines' } })
    expect(getTransformOutput()).toHaveValue('apple\nbanana\ncherry')
  })

  it('performs literal find & replace', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'foo bar foo' } })
    // Find field (placeholder changes when regex is on/off)
    fireEvent.change(screen.getByPlaceholderText('literal text…'), { target: { value: 'foo' } })
    // Replace field
    fireEvent.change(screen.getByPlaceholderText('replacement…'), { target: { value: 'baz' } })
    // default is global replace
    expect(getFROutput()).toHaveValue('baz bar baz')
  })

  it('performs regex find & replace', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'cat123dog456' } })
    // enable regex
    fireEvent.click(screen.getByLabelText('Regex'))
    fireEvent.change(screen.getByPlaceholderText('pattern…'), { target: { value: '\\d+' } })
    fireEvent.change(screen.getByPlaceholderText('replacement…'), { target: { value: 'NUM' } })
    expect(getFROutput()).toHaveValue('catNUMdogNUM')
  })

  it('shows regex error for invalid pattern', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'hello' } })
    fireEvent.click(screen.getByLabelText('Regex'))
    // invalid regex: unclosed bracket
    fireEvent.change(screen.getByPlaceholderText('pattern…'), { target: { value: '[invalid' } })
    expect(screen.getByText(/Regex error/i)).toBeInTheDocument()
  })

  it('shows empty transform output when input is empty', () => {
    render(<StringUtilities />)
    expect(getTransformOutput()).toHaveValue('')
  })

  it('counts multiple lines correctly', () => {
    render(<StringUtilities />)
    fireEvent.change(getInputArea(), { target: { value: 'line1\nline2\nline3' } })
    // 3 lines
    expect(getStatValue('Lines')).toBe('3')
  })
})
