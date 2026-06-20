import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TextDiff from '@/components/tools/TextDiff'

function setInputs(original: string, changed: string) {
  fireEvent.change(screen.getByPlaceholderText('Original text…'), {
    target: { value: original },
  })
  fireEvent.change(screen.getByPlaceholderText('Changed text…'), {
    target: { value: changed },
  })
}

describe('TextDiff', () => {
  it('prompts for input when both panels are empty', () => {
    render(<TextDiff />)
    expect(screen.getByText(/Enter text in both panels/i)).toBeInTheDocument()
  })

  it('shows "No differences" for identical inputs', () => {
    render(<TextDiff />)
    setInputs('a\nb\nc', 'a\nb\nc')
    expect(screen.getByText('No differences')).toBeInTheDocument()
  })

  it('detects one added and one removed line', () => {
    render(<TextDiff />)
    setInputs('a\nb\nc', 'a\nx\nc')

    // summary "+1 −1"
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('−1')).toBeInTheDocument()

    // the removed line "b" and added line "x" are both rendered
    expect(screen.getByText('b')).toBeInTheDocument()
    expect(screen.getByText('x')).toBeInTheDocument()
  })

  it('colors added line acid and removed line red', () => {
    render(<TextDiff />)
    setInputs('a\nb\nc', 'a\nx\nc')

    const added = screen.getByText('x').closest('div') as HTMLElement
    const removed = screen.getByText('b').closest('div') as HTMLElement
    expect(added.style.color).toContain('--acid')
    // jsdom normalizes #ff6a4d to its rgb() form
    expect(removed.style.color).toBe('rgb(255, 106, 77)')
  })

  it('counts purely-added lines', () => {
    render(<TextDiff />)
    setInputs('a', 'a\nb\nc')
    // two added (b, c), zero removed
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByText('−0')).toBeInTheDocument()
  })

  it('counts purely-removed lines', () => {
    render(<TextDiff />)
    setInputs('a\nb\nc', 'a')
    expect(screen.getByText('+0')).toBeInTheDocument()
    expect(screen.getByText('−2')).toBeInTheDocument()
  })

  it('treats differing content as a diff, not identical, when only one side has text', () => {
    render(<TextDiff />)
    setInputs('hello', '')
    // one removed line, no "No differences"
    expect(screen.queryByText('No differences')).not.toBeInTheDocument()
    expect(screen.getByText('−1')).toBeInTheDocument()
  })
})
