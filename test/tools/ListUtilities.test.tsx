import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ListUtilities from '@/components/tools/ListUtilities'

function getListA() {
  const textareas = screen.getAllByPlaceholderText('one item per line…')
  return textareas[0]
}

function getListB() {
  const textareas = screen.getAllByPlaceholderText('one item per line…')
  return textareas[1]
}

function getOutputArea() {
  return screen.getByPlaceholderText('Result will appear here…')
}

function getSelect() {
  return screen.getByRole('combobox')
}

describe('ListUtilities', () => {
  it('renders with default union operation and empty output', () => {
    render(<ListUtilities />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(getOutputArea()).toHaveValue('')
  })

  it('computes union of two lists, deduplicating', () => {
    render(<ListUtilities />)
    fireEvent.change(getListA(), { target: { value: 'apple\nbanana\ncherry' } })
    fireEvent.change(getListB(), { target: { value: 'banana\ndate\napple' } })
    // union: apple, banana, cherry, date (in order of first appearance)
    const out = (getOutputArea() as HTMLTextAreaElement).value
    const lines = out.split('\n').filter(Boolean)
    expect(lines).toContain('apple')
    expect(lines).toContain('banana')
    expect(lines).toContain('cherry')
    expect(lines).toContain('date')
    // no duplicates
    expect(lines.length).toBe(4)
    expect(screen.getByText(/Output — 4 items/i)).toBeInTheDocument()
  })

  it('computes intersection of two lists', () => {
    render(<ListUtilities />)
    fireEvent.change(getSelect(), { target: { value: 'intersect' } })
    fireEvent.change(getListA(), { target: { value: 'apple\nbanana\ncherry' } })
    fireEvent.change(getListB(), { target: { value: 'banana\ncherry\ndate' } })
    const out = (getOutputArea() as HTMLTextAreaElement).value
    const lines = out.split('\n').filter(Boolean)
    expect(lines).toEqual(['banana', 'cherry'])
    expect(screen.getByText(/Output — 2 items/i)).toBeInTheDocument()
  })

  it('computes difference A − B', () => {
    render(<ListUtilities />)
    fireEvent.change(getSelect(), { target: { value: 'diff' } })
    fireEvent.change(getListA(), { target: { value: 'apple\nbanana\ncherry' } })
    fireEvent.change(getListB(), { target: { value: 'banana' } })
    const out = (getOutputArea() as HTMLTextAreaElement).value
    const lines = out.split('\n').filter(Boolean)
    expect(lines).toEqual(['apple', 'cherry'])
  })

  it('computes symmetric difference', () => {
    render(<ListUtilities />)
    fireEvent.change(getSelect(), { target: { value: 'symdiff' } })
    fireEvent.change(getListA(), { target: { value: 'apple\nbanana' } })
    fireEvent.change(getListB(), { target: { value: 'banana\ndate' } })
    const out = (getOutputArea() as HTMLTextAreaElement).value
    const lines = out.split('\n').filter(Boolean)
    expect(lines).toContain('apple')
    expect(lines).toContain('date')
    expect(lines).not.toContain('banana')
  })

  it('deduplicates list A', () => {
    render(<ListUtilities />)
    fireEvent.change(getSelect(), { target: { value: 'dedupe' } })
    fireEvent.change(getListA(), { target: { value: 'apple\nbanana\napple\ncherry\nbanana' } })
    const out = (getOutputArea() as HTMLTextAreaElement).value
    const lines = out.split('\n').filter(Boolean)
    expect(lines).toEqual(['apple', 'banana', 'cherry'])
  })

  it('sorts list A alphabetically', () => {
    render(<ListUtilities />)
    fireEvent.change(getSelect(), { target: { value: 'sort' } })
    fireEvent.change(getListA(), { target: { value: 'cherry\napple\nbanana' } })
    const out = (getOutputArea() as HTMLTextAreaElement).value
    const lines = out.split('\n').filter(Boolean)
    expect(lines).toEqual(['apple', 'banana', 'cherry'])
  })

  it('reverses list A', () => {
    render(<ListUtilities />)
    fireEvent.change(getSelect(), { target: { value: 'reverse' } })
    fireEvent.change(getListA(), { target: { value: 'a\nb\nc' } })
    const out = (getOutputArea() as HTMLTextAreaElement).value
    const lines = out.split('\n').filter(Boolean)
    expect(lines).toEqual(['c', 'b', 'a'])
  })

  it('concatenates A then B', () => {
    render(<ListUtilities />)
    fireEvent.change(getSelect(), { target: { value: 'concat' } })
    fireEvent.change(getListA(), { target: { value: 'a\nb' } })
    fireEvent.change(getListB(), { target: { value: 'c\nd' } })
    const out = (getOutputArea() as HTMLTextAreaElement).value
    const lines = out.split('\n').filter(Boolean)
    expect(lines).toEqual(['a', 'b', 'c', 'd'])
  })

  it('applies ignore case for union', () => {
    render(<ListUtilities />)
    // enable ignore case
    fireEvent.click(screen.getByLabelText('Ignore case'))
    fireEvent.change(getListA(), { target: { value: 'Apple\nBanana' } })
    fireEvent.change(getListB(), { target: { value: 'apple\nCHERRY' } })
    const out = (getOutputArea() as HTMLTextAreaElement).value
    const lines = out.split('\n').filter(Boolean)
    // apple and Apple are the same under ignore case, so 3 items
    expect(lines.length).toBe(3)
  })

  it('empty lists produce empty output', () => {
    render(<ListUtilities />)
    expect(getOutputArea()).toHaveValue('')
    expect(screen.getByText(/Output — 0 items/i)).toBeInTheDocument()
  })
})
