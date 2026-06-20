import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RegexTester from '@/components/tools/RegexTester'

function fill(pattern: string, flags: string, test: string) {
  fireEvent.change(screen.getByPlaceholderText('\\d+'), { target: { value: pattern } })
  fireEvent.change(screen.getByPlaceholderText('gi'), { target: { value: flags } })
  fireEvent.change(screen.getByPlaceholderText('Text to match against…'), {
    target: { value: test },
  })
}

describe('RegexTester', () => {
  it('finds 2 numeric matches with the global flag', () => {
    render(<RegexTester />)
    fill('\\d+', 'g', 'a1b22c')

    expect(screen.getByText('2 matches')).toBeInTheDocument()
    // the matched substrings are highlighted in <mark> elements
    const marks = document.querySelectorAll('mark')
    expect(Array.from(marks).map((m) => m.textContent)).toEqual(['1', '22'])
  })

  it('reports match indices', () => {
    render(<RegexTester />)
    fill('\\d+', 'g', 'a1b22c')
    expect(screen.getByText('@ 1')).toBeInTheDocument() // "1" at index 1
    expect(screen.getByText('@ 3')).toBeInTheDocument() // "22" at index 3
  })

  it('shows a single match (no global flag) as "1 match"', () => {
    render(<RegexTester />)
    fill('\\d+', '', 'a1b22c')
    expect(screen.getByText('1 match')).toBeInTheDocument()
  })

  it('extracts capture groups', () => {
    render(<RegexTester />)
    fill('(\\d)(\\d)', 'g', '12 34')
    // two matches "12" and "34", each with groups 1 and 2
    expect(screen.getAllByText(/group 1:/).length).toBe(2)
    expect(screen.getAllByText(/group 2:/).length).toBe(2)
  })

  it('shows an error for an invalid pattern', () => {
    render(<RegexTester />)
    fill('(', 'g', 'abc')
    // notice with error styling; the RegExp constructor throws
    const notice = document.querySelector('.notice.error')
    expect(notice).toBeTruthy()
  })

  it('reports zero matches without crashing', () => {
    render(<RegexTester />)
    fill('z+', 'g', 'a1b22c')
    expect(screen.getByText('0 matches')).toBeInTheDocument()
  })

  it('does not hang on a zero-length global match', () => {
    render(<RegexTester />)
    // empty-string-capable pattern with /g would loop forever without the guard
    fill('a*', 'g', 'aXbXc')
    // it should terminate and report at least one match
    expect(screen.getByText(/match/)).toBeInTheDocument()
  })

  it('highlights matched substrings via <mark>', () => {
    render(<RegexTester />)
    fill('\\d+', 'g', 'a1b22c')
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBe(2)
    expect(marks[0].textContent).toBe('1')
    expect(marks[1].textContent).toBe('22')
  })
})
