import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JsonDiff from '@/components/tools/JsonDiff'

function setLeft(value: string) {
  fireEvent.change(screen.getAllByPlaceholderText('{"key": "value"}')[0], {
    target: { value },
  })
}

function setRight(value: string) {
  fireEvent.change(screen.getAllByPlaceholderText('{"key": "value"}')[1], {
    target: { value },
  })
}

describe('JsonDiff', () => {
  it('shows no differences for identical JSON', () => {
    render(<JsonDiff />)
    setLeft('{"a":1}')
    setRight('{"a":1}')
    expect(screen.getByText(/No differences/i)).toBeInTheDocument()
  })

  it('detects a changed value', () => {
    render(<JsonDiff />)
    setLeft('{"a":1,"b":2}')
    setRight('{"a":1,"b":3,"c":4}')
    // "b" should be marked changed
    const items = screen.getAllByRole('listitem')
    const changed = items.find((el) => el.dataset.kind === 'changed')
    expect(changed).toBeTruthy()
    expect(changed!.textContent).toContain('b')
  })

  it('detects an added key', () => {
    render(<JsonDiff />)
    setLeft('{"a":1,"b":2}')
    setRight('{"a":1,"b":3,"c":4}')
    const items = screen.getAllByRole('listitem')
    const added = items.find((el) => el.dataset.kind === 'added')
    expect(added).toBeTruthy()
    expect(added!.textContent).toContain('c')
  })

  it('detects a removed key', () => {
    render(<JsonDiff />)
    setLeft('{"a":1,"b":2,"d":5}')
    setRight('{"a":1,"b":2}')
    const items = screen.getAllByRole('listitem')
    const removed = items.find((el) => el.dataset.kind === 'removed')
    expect(removed).toBeTruthy()
    expect(removed!.textContent).toContain('d')
  })

  it('counts correctly: 1 changed, 1 added, 0 removed for {a:1,b:2} vs {a:1,b:3,c:4}', () => {
    render(<JsonDiff />)
    setLeft('{"a":1,"b":2}')
    setRight('{"a":1,"b":3,"c":4}')
    const items = screen.getAllByRole('listitem')
    const changed = items.filter((el) => el.dataset.kind === 'changed')
    const added = items.filter((el) => el.dataset.kind === 'added')
    const removed = items.filter((el) => el.dataset.kind === 'removed')
    expect(changed).toHaveLength(1)
    expect(added).toHaveLength(1)
    expect(removed).toHaveLength(0)
  })

  it('detects nested changes via dotted path', () => {
    render(<JsonDiff />)
    setLeft('{"outer":{"inner":1}}')
    setRight('{"outer":{"inner":2}}')
    const items = screen.getAllByRole('listitem')
    expect(items[0].textContent).toContain('outer.inner')
  })

  it('detects array element changes', () => {
    render(<JsonDiff />)
    setLeft('[1,2,3]')
    setRight('[1,2,4]')
    const items = screen.getAllByRole('listitem')
    const changed = items.find((el) => el.dataset.kind === 'changed')
    expect(changed).toBeTruthy()
    expect(changed!.textContent).toContain('[2]')
  })

  it('shows an error for invalid left JSON', () => {
    render(<JsonDiff />)
    setLeft('{bad json}')
    setRight('{"a":1}')
    expect(screen.getByText(/Left JSON is invalid/i)).toBeInTheDocument()
  })

  it('shows an error for invalid right JSON', () => {
    render(<JsonDiff />)
    setLeft('{"a":1}')
    setRight('{bad json}')
    expect(screen.getByText(/Right JSON is invalid/i)).toBeInTheDocument()
  })

  it('is empty for empty inputs', () => {
    render(<JsonDiff />)
    expect(screen.queryByRole('listitem')).toBeNull()
    expect(screen.queryByText(/No differences/i)).toBeNull()
  })
})
