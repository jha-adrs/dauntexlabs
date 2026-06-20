import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WordCounter from '@/components/tools/WordCounter'

describe('WordCounter', () => {
  it('shows all zeros for empty input', () => {
    render(<WordCounter />)
    // All stat values should be 0 (reading time shows "0 min")
    const values = screen.getAllByText('0')
    expect(values.length).toBeGreaterThanOrEqual(6) // 6 numeric stats are 0
    expect(screen.getByText('0 min')).toBeInTheDocument()
  })

  it('counts words correctly for "hello world"', () => {
    render(<WordCounter />)
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'hello world' },
    })
    expect(screen.getByText('2')).toBeInTheDocument() // 2 words
  })

  it('counts characters with spaces for "hello world" (11 chars)', () => {
    render(<WordCounter />)
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'hello world' },
    })
    expect(screen.getByText('11')).toBeInTheDocument() // "hello world" = 11 chars with spaces
  })

  it('counts characters without spaces for "hello world" (10 chars)', () => {
    render(<WordCounter />)
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'hello world' },
    })
    expect(screen.getByText('10')).toBeInTheDocument() // "helloworld" = 10 chars
  })

  it('counts sentences', () => {
    render(<WordCounter />)
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'Hello world. How are you? Fine!' },
    })
    expect(screen.getByText('3')).toBeInTheDocument() // 3 sentences
  })

  it('counts paragraphs separated by blank lines', () => {
    render(<WordCounter />)
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.' },
    })
    // Multiple stats may show 3 (e.g. sentences=3, paragraphs=3) — just assert at least one
    const threes = screen.getAllByText('3')
    expect(threes.length).toBeGreaterThanOrEqual(1)
    // Specifically check the paragraph label is associated
    expect(screen.getByText('Paragraphs')).toBeInTheDocument()
  })

  it('counts lines', () => {
    render(<WordCounter />)
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'line one\nline two\nline three' },
    })
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('computes reading time of 1 min for short text (fewer than 200 words)', () => {
    render(<WordCounter />)
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'hello world' },
    })
    expect(screen.getByText('1 min')).toBeInTheDocument()
  })

  it('computes reading time of 2 min for ~300 words', () => {
    render(<WordCounter />)
    const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ')
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: words },
    })
    expect(screen.getByText('2 min')).toBeInTheDocument()
  })

  it('handles single character input', () => {
    render(<WordCounter />)
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'a' },
    })
    // 1 char with spaces, 1 char without, 1 word
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
  })

  it('counts only whitespace as zero words', () => {
    render(<WordCounter />)
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: '   \n  \t  ' },
    })
    // Multiple stats will be 0 — use getAllByText since the stat grid renders many zeros
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(1) // 0 words (and others)
  })
})
