import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ReadabilityScore from '@/components/tools/ReadabilityScore'

describe('ReadabilityScore', () => {
  it('shows a prompt when the input is empty', () => {
    render(<ReadabilityScore />)
    expect(screen.getByText(/enter some text/i)).toBeInTheDocument()
  })

  it('shows Flesch Reading Ease > 60 for a simple sentence', () => {
    render(<ReadabilityScore />)
    fireEvent.change(screen.getByPlaceholderText(/paste or type/i), {
      target: { value: 'The cat sat on the mat.' },
    })
    // Score should be present in the document as a number string > 60
    expect(screen.getByText('Flesch Reading Ease')).toBeInTheDocument()
    // The score is the nextElementSibling of the label div
    const label = screen.getByText('Flesch Reading Ease')
    const scoreEl = label.nextElementSibling as HTMLElement | null
    expect(scoreEl).not.toBeNull()
    const score = parseFloat(scoreEl!.textContent ?? '0')
    expect(score).toBeGreaterThan(60)
  })

  it('renders word, sentence, and syllable counts for a known sentence', () => {
    render(<ReadabilityScore />)
    // "The quick brown fox jumps over the lazy dog."
    // Words: 9, Sentences: 1 (one period), Syllables: heuristic
    fireEvent.change(screen.getByPlaceholderText(/paste or type/i), {
      target: { value: 'The quick brown fox jumps over the lazy dog.' },
    })
    // All three count labels should be in the DOM
    expect(screen.getByText('Words')).toBeInTheDocument()
    expect(screen.getByText('Sentences')).toBeInTheDocument()
    expect(screen.getByText('Syllables')).toBeInTheDocument()

    // Word count should be 9: the sibling div to the 'Words' label contains the number
    // The count grid items each have: <div> <div>{number}</div> <div>{label}</div> </div>
    const wordsLabel = screen.getByText('Words')
    const countDiv = wordsLabel.previousElementSibling as HTMLElement | null
    expect(countDiv).not.toBeNull()
    expect(parseInt(countDiv!.textContent ?? '0')).toBe(9)
  })

  it('shows a plain-English ease label', () => {
    render(<ReadabilityScore />)
    fireEvent.change(screen.getByPlaceholderText(/paste or type/i), {
      target: { value: 'The cat sat on the mat.' },
    })
    const labels = [
      'Very Easy',
      'Easy',
      'Fairly Easy',
      'Standard',
      'Fairly Difficult',
      'Difficult',
      'Very Confusing',
    ]
    const found = labels.some((l) => {
      try {
        screen.getByText(l)
        return true
      } catch {
        return false
      }
    })
    expect(found).toBe(true)
  })

  it('shows Flesch-Kincaid Grade Level label', () => {
    render(<ReadabilityScore />)
    fireEvent.change(screen.getByPlaceholderText(/paste or type/i), {
      target: { value: 'The cat sat on the mat.' },
    })
    expect(screen.getByText('Flesch-Kincaid Grade Level')).toBeInTheDocument()
  })

  it('handles multi-sentence text with correct sentence count', () => {
    render(<ReadabilityScore />)
    fireEvent.change(screen.getByPlaceholderText(/paste or type/i), {
      target: { value: 'Hello world. This is a test. Is it working?' },
    })
    // 3 sentences: the count div is the previousElementSibling of the 'Sentences' label
    const sentLabel = screen.getByText('Sentences')
    const countDiv = sentLabel.previousElementSibling as HTMLElement | null
    expect(countDiv).not.toBeNull()
    expect(parseInt(countDiv!.textContent ?? '0')).toBe(3)
  })
})
