import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChmodCalculator from '@/components/tools/ChmodCalculator'

function octalDisplay(): string {
  return screen.getByLabelText('octal permissions').textContent ?? ''
}
function symbolicDisplay(): string {
  return screen.getByLabelText('symbolic permissions').textContent ?? ''
}
function octalInput(): HTMLInputElement {
  return screen.getByPlaceholderText('755') as HTMLInputElement
}
function toggle(name: string): HTMLInputElement {
  return screen.getByLabelText(name) as HTMLInputElement
}

describe('ChmodCalculator', () => {
  it('starts at 755 / rwxr-xr-x', () => {
    render(<ChmodCalculator />)
    expect(octalDisplay()).toBe('755')
    expect(symbolicDisplay()).toBe('rwxr-xr-x')
  })

  it('reflects 755 in the toggle states', () => {
    render(<ChmodCalculator />)
    // owner: rwx all on
    expect(toggle('owner read').checked).toBe(true)
    expect(toggle('owner write').checked).toBe(true)
    expect(toggle('owner execute').checked).toBe(true)
    // group: r-x
    expect(toggle('group read').checked).toBe(true)
    expect(toggle('group write').checked).toBe(false)
    expect(toggle('group execute').checked).toBe(true)
    // other: r-x
    expect(toggle('other read').checked).toBe(true)
    expect(toggle('other write').checked).toBe(false)
    expect(toggle('other execute').checked).toBe(true)
  })

  it('typing 644 updates toggles and symbolic display', () => {
    render(<ChmodCalculator />)
    fireEvent.change(octalInput(), { target: { value: '644' } })
    expect(octalDisplay()).toBe('644')
    expect(symbolicDisplay()).toBe('rw-r--r--')
    expect(toggle('owner read').checked).toBe(true)
    expect(toggle('owner write').checked).toBe(true)
    expect(toggle('owner execute').checked).toBe(false)
    expect(toggle('group read').checked).toBe(true)
    expect(toggle('group write').checked).toBe(false)
    expect(toggle('other read').checked).toBe(true)
    expect(toggle('other execute').checked).toBe(false)
  })

  it('toggling a bit updates octal + symbolic', () => {
    render(<ChmodCalculator />)
    // start 755, turn off owner execute -> 655 -> rw-r-xr-x
    fireEvent.click(toggle('owner execute'))
    expect(octalDisplay()).toBe('655')
    expect(symbolicDisplay()).toBe('rw-r-xr-x')
  })

  it('turning everything off yields 000 / ---------', () => {
    render(<ChmodCalculator />)
    fireEvent.change(octalInput(), { target: { value: '0' } })
    expect(octalDisplay()).toBe('000')
    expect(symbolicDisplay()).toBe('---------')
  })

  it('computes 777 / rwxrwxrwx', () => {
    render(<ChmodCalculator />)
    fireEvent.change(octalInput(), { target: { value: '777' } })
    expect(octalDisplay()).toBe('777')
    expect(symbolicDisplay()).toBe('rwxrwxrwx')
  })

  it('ignores invalid octal input (keeps prior toggle state)', () => {
    render(<ChmodCalculator />)
    fireEvent.change(octalInput(), { target: { value: '99' } })
    // 9 is not a valid octal digit; toggles remain at 755
    expect(octalDisplay()).toBe('755')
    expect(symbolicDisplay()).toBe('rwxr-xr-x')
  })

  it('left-pads a short octal like "7" to 007', () => {
    render(<ChmodCalculator />)
    fireEvent.change(octalInput(), { target: { value: '7' } })
    expect(octalDisplay()).toBe('007')
    expect(symbolicDisplay()).toBe('------rwx')
  })
})
