import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CidrCalculator from '@/components/tools/CidrCalculator'

/** Read the value cell next to a labeled row. */
function rowValue(label: string): string {
  const labelEl = screen.getByText(label)
  const row = labelEl.parentElement as HTMLElement
  const code = row.querySelector('code')
  return code?.textContent ?? ''
}

describe('CidrCalculator', () => {
  it('computes a /24 block correctly (default input)', () => {
    render(<CidrCalculator />)
    // default is 192.168.1.0/24
    expect(rowValue('Network')).toBe('192.168.1.0')
    expect(rowValue('Broadcast')).toBe('192.168.1.255')
    expect(rowValue('Netmask')).toBe('255.255.255.0')
    expect(rowValue('Wildcard')).toBe('0.0.0.255')
    expect(rowValue('First host')).toBe('192.168.1.1')
    expect(rowValue('Last host')).toBe('192.168.1.254')
    expect(rowValue('Total addresses')).toBe('256')
    expect(rowValue('Usable hosts')).toBe('254')
  })

  it('snaps a host IP to its network address', () => {
    render(<CidrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('192.168.1.10/24'), {
      target: { value: '192.168.1.10/24' },
    })
    expect(rowValue('Network')).toBe('192.168.1.0')
    expect(rowValue('Broadcast')).toBe('192.168.1.255')
  })

  it('computes a /16 block', () => {
    render(<CidrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('192.168.1.10/24'), {
      target: { value: '10.0.0.0/16' },
    })
    expect(rowValue('Network')).toBe('10.0.0.0')
    expect(rowValue('Broadcast')).toBe('10.0.255.255')
    expect(rowValue('Netmask')).toBe('255.255.0.0')
    expect(rowValue('Total addresses')).toBe('65536')
    expect(rowValue('Usable hosts')).toBe('65534')
  })

  it('handles /32 single host', () => {
    render(<CidrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('192.168.1.10/24'), {
      target: { value: '8.8.8.8/32' },
    })
    expect(rowValue('Network')).toBe('8.8.8.8')
    expect(rowValue('Broadcast')).toBe('8.8.8.8')
    expect(rowValue('Total addresses')).toBe('1')
    expect(rowValue('Usable hosts')).toBe('1')
  })

  it('handles /31 point-to-point (2 usable)', () => {
    render(<CidrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('192.168.1.10/24'), {
      target: { value: '192.168.1.0/31' },
    })
    expect(rowValue('Total addresses')).toBe('2')
    expect(rowValue('Usable hosts')).toBe('2')
  })

  it('handles /0 (whole address space) without negative usable', () => {
    render(<CidrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('192.168.1.10/24'), {
      target: { value: '0.0.0.0/0' },
    })
    expect(rowValue('Netmask')).toBe('0.0.0.0')
    expect(rowValue('Total addresses')).toBe('4294967296')
    expect(rowValue('Broadcast')).toBe('255.255.255.255')
  })

  it('errors on an octet over 255', () => {
    render(<CidrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('192.168.1.10/24'), {
      target: { value: '300.1.1.1/24' },
    })
    expect(screen.getByText(/Invalid IPv4 address/i)).toBeInTheDocument()
  })

  it('errors on a prefix over 32', () => {
    render(<CidrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('192.168.1.10/24'), {
      target: { value: '10.0.0.0/40' },
    })
    expect(screen.getByText(/out of range/i)).toBeInTheDocument()
  })

  it('errors when the prefix is missing', () => {
    render(<CidrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('192.168.1.10/24'), {
      target: { value: '10.0.0.0' },
    })
    expect(screen.getByText(/Missing prefix/i)).toBeInTheDocument()
  })
})
