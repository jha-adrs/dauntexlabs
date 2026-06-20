import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SqlFormatter from '@/components/tools/SqlFormatter'

const out = () => (screen.getByPlaceholderText('Formatted SQL will appear here…') as HTMLTextAreaElement).value
const type = (v: string) =>
  fireEvent.change(screen.getByPlaceholderText('select a, b from t where x = 1 and y = 2'), {
    target: { value: v },
  })

describe('SqlFormatter', () => {
  it('is empty for empty input', () => {
    render(<SqlFormatter />)
    expect(out()).toBe('')
  })

  it('puts SELECT / FROM / WHERE on their own lines and uppercases keywords', () => {
    render(<SqlFormatter />)
    type('select a,b from t where x=1 and y=2')
    const value = out()
    expect(value).toContain('SELECT')
    expect(value).toContain('\nFROM ')
    expect(value).toContain('\nWHERE ')
  })

  it('starts the formatted output with SELECT (clause leads the first line)', () => {
    render(<SqlFormatter />)
    type('select a,b from t where x=1 and y=2')
    expect(out().startsWith('SELECT')).toBe(true)
  })

  it('puts AND / OR on indented new lines', () => {
    render(<SqlFormatter />)
    type('select * from t where x=1 and y=2 or z=3')
    const value = out()
    expect(value).toMatch(/\n {2}AND\b/)
    expect(value).toMatch(/\n {2}OR\b/)
  })

  it('keeps quoted string literals intact and does not uppercase their contents', () => {
    render(<SqlFormatter />)
    type("select name from users where city = 'from new york'")
    const value = out()
    // the lowercase word "from" inside the string must survive untouched
    expect(value).toContain("'from new york'")
  })

  it('uppercases lowercased keywords when the toggle is on (default)', () => {
    render(<SqlFormatter />)
    type('select id from t')
    const value = out()
    expect(value).toContain('SELECT')
    expect(value).toContain('FROM')
    expect(value).not.toContain('select')
  })

  it('leaves keyword casing as typed when the toggle is off', () => {
    render(<SqlFormatter />)
    fireEvent.click(screen.getByLabelText('Uppercase keywords'))
    type('select id from t')
    const value = out()
    expect(value).toContain('select')
    expect(value).not.toContain('SELECT')
  })

  it('formats common JOIN clauses onto their own lines', () => {
    render(<SqlFormatter />)
    type('select a from t left join u on t.id = u.id')
    const value = out()
    expect(value).toContain('\nLEFT JOIN ')
    expect(value).toContain('\nON ')
  })

  it('handles GROUP BY and ORDER BY as multi-word clauses', () => {
    render(<SqlFormatter />)
    type('select a, count(b) from t group by a order by a')
    const value = out()
    expect(value).toContain('\nGROUP BY ')
    expect(value).toContain('\nORDER BY ')
  })

  it('separates SELECT columns with commas', () => {
    render(<SqlFormatter />)
    type('select a,b,c from t')
    const value = out()
    expect(value).toContain('a, b, c')
  })
})
