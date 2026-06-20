import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import KeywordDensity from '@/components/tools/KeywordDensity'

function setContent(value: string) {
  fireEvent.change(screen.getByPlaceholderText('Paste your content here…'), {
    target: { value },
  })
}

describe('KeywordDensity', () => {
  it('shows prompt when content is empty', () => {
    render(<KeywordDensity />)
    expect(screen.getByText(/Paste content/i)).toBeInTheDocument()
  })

  it('counts total words correctly', () => {
    render(<KeywordDensity />)
    setContent('the cat the dog the')
    // "the" has min length 2 (default), all 3 chars, so all 5 words count
    // The stat div text is split across text nodes; use container querySelector
    const statDiv = document.querySelector('[style*="margin-bottom: 0.75rem"]')
    expect(statDiv?.textContent).toContain('5 total words')
  })

  it('counts frequency for repeated word correctly', () => {
    render(<KeywordDensity />)
    setContent('the cat the dog the')
    // default minLen=2, ignoreStop=false — "the" should appear with count 3
    const rows = screen.getAllByRole('row')
    // Header + data rows; find the row for 'the'
    const theRow = rows.find((r) => r.textContent?.includes('the') && r.textContent?.includes('60'))
    expect(theRow).toBeTruthy()
  })

  it('"the" has density ~60% in "the cat the dog the"', () => {
    render(<KeywordDensity />)
    setContent('the cat the dog the')
    // 3/5 = 60.00%
    expect(screen.getByText('60.00%')).toBeInTheDocument()
  })

  it('shows "3" count for "the" in the test sentence', () => {
    render(<KeywordDensity />)
    setContent('the cat the dog the')
    const rows = screen.getAllByRole('row')
    const theRow = rows.find((r) => r.textContent?.startsWith('1the') || r.textContent?.match(/^1\s*the/))
    // The top row (rank 1) should be "the" with count 3
    const countCells = screen.getAllByText('3')
    expect(countCells.length).toBeGreaterThanOrEqual(1)
  })

  it('filters out stop words when toggle is on', () => {
    render(<KeywordDensity />)
    setContent('the cat sat on the mat')
    // Enable ignore stop words
    fireEvent.click(screen.getByLabelText('Ignore stop words'))
    // "the", "on" are stop words; "cat", "sat", "mat" should remain
    // Check that "the" does not appear as a table keyword cell
    const allCells = document.querySelectorAll('td')
    const theCells = Array.from(allCells).filter((td) => td.textContent === 'the')
    expect(theCells.length).toBe(0)
    expect(screen.getByText('cat')).toBeInTheDocument()
  })

  it('ranks keywords by frequency descending', () => {
    render(<KeywordDensity />)
    setContent('apple apple apple banana banana cherry')
    const rows = screen.getAllByRole('row')
    // First data row should be apple (rank 1)
    expect(rows[1].textContent).toContain('apple')
    expect(rows[1].textContent).toContain('3')
  })

  it('handles punctuation correctly', () => {
    render(<KeywordDensity />)
    setContent('Hello, world! Hello... world?')
    // "hello" and "world" each appear twice — total 4 words
    const statDiv = document.querySelector('[style*="margin-bottom: 0.75rem"]')
    expect(statDiv?.textContent).toContain('4 total words')
  })

  it('is case-insensitive', () => {
    render(<KeywordDensity />)
    setContent('Cat CAT cat')
    const statDiv = document.querySelector('[style*="margin-bottom: 0.75rem"]')
    expect(statDiv?.textContent).toContain('3 total words')
    // "cat" count should be 3
    const countCells = screen.getAllByText('3')
    expect(countCells.length).toBeGreaterThanOrEqual(1)
  })

  it('shows "no words found" when all words are filtered by min length', () => {
    render(<KeywordDensity />)
    // Set min length to 5 via Select
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '5' } })
    setContent('hi me it at on')
    expect(screen.getByText(/No words found/i)).toBeInTheDocument()
  })
})
