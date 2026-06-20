import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EnvToJson from '@/components/tools/EnvToJson'

describe('EnvToJson', () => {
  it('converts basic env vars to JSON', () => {
    render(<EnvToJson />)
    fireEvent.change(screen.getByPlaceholderText(/KEY=value/), {
      target: { value: 'A=1\n# comment\nB=hello' },
    })
    const out = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value
    const parsed = JSON.parse(out)
    expect(parsed).toEqual({ A: '1', B: 'hello' })
  })

  it('strips surrounding double quotes from values', () => {
    render(<EnvToJson />)
    fireEvent.change(screen.getByPlaceholderText(/KEY=value/), {
      target: { value: 'DB_URL="postgres://localhost/db"' },
    })
    const out = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value
    const parsed = JSON.parse(out)
    expect(parsed['DB_URL']).toBe('postgres://localhost/db')
  })

  it('strips surrounding single quotes from values', () => {
    render(<EnvToJson />)
    fireEvent.change(screen.getByPlaceholderText(/KEY=value/), {
      target: { value: "SECRET='my secret'" },
    })
    const out = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value
    const parsed = JSON.parse(out)
    expect(parsed['SECRET']).toBe('my secret')
  })

  it('ignores blank lines and comment lines', () => {
    render(<EnvToJson />)
    fireEvent.change(screen.getByPlaceholderText(/KEY=value/), {
      target: { value: '\n# this is a comment\n\nFOO=bar\n' },
    })
    const out = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value
    const parsed = JSON.parse(out)
    expect(Object.keys(parsed)).toEqual(['FOO'])
    expect(parsed['FOO']).toBe('bar')
  })

  it('handles values with equals signs in them', () => {
    render(<EnvToJson />)
    fireEvent.change(screen.getByPlaceholderText(/KEY=value/), {
      target: { value: 'TOKEN=abc=def=ghi' },
    })
    const out = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value
    const parsed = JSON.parse(out)
    expect(parsed['TOKEN']).toBe('abc=def=ghi')
  })

  it('produces empty JSON object for empty/comment-only input', () => {
    render(<EnvToJson />)
    fireEvent.change(screen.getByPlaceholderText(/KEY=value/), {
      target: { value: '# just a comment' },
    })
    const out = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value
    expect(JSON.parse(out)).toEqual({})
  })

  it('converts JSON to env format', () => {
    render(<EnvToJson />)
    // Switch to JSON → .env mode
    fireEvent.click(screen.getByRole('tab', { name: 'JSON → .env' }))
    // In json-to-env mode, the input textarea has "JSON input" panel title
    // Find by the panel — the non-readOnly textarea is the input
    const inputs = document.querySelectorAll('textarea:not([readonly])')
    fireEvent.change(inputs[0], {
      target: { value: '{"KEY":"value","PORT":"3000"}' },
    })
    const out = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value
    expect(out).toContain('KEY=value')
    expect(out).toContain('PORT=3000')
  })

  it('quotes values with spaces in JSON → .env mode', () => {
    render(<EnvToJson />)
    fireEvent.click(screen.getByRole('tab', { name: 'JSON → .env' }))
    const inputs = document.querySelectorAll('textarea:not([readonly])')
    fireEvent.change(inputs[0], {
      target: { value: '{"MSG":"hello world"}' },
    })
    const out = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value
    expect(out).toContain('"hello world"')
  })

  it('shows error for invalid JSON in json-to-env mode', () => {
    render(<EnvToJson />)
    fireEvent.click(screen.getByRole('tab', { name: 'JSON → .env' }))
    const inputs = document.querySelectorAll('textarea:not([readonly])')
    fireEvent.change(inputs[0], {
      target: { value: '{not valid json' },
    })
    // Should show a Notice error — use getAllByText since multiple elements could match
    expect(screen.getAllByText(/JSON|parse|invalid/i).length).toBeGreaterThan(0)
  })

  it('shows error for JSON array in json-to-env mode', () => {
    render(<EnvToJson />)
    fireEvent.click(screen.getByRole('tab', { name: 'JSON → .env' }))
    const inputs = document.querySelectorAll('textarea:not([readonly])')
    fireEvent.change(inputs[0], {
      target: { value: '[1,2,3]' },
    })
    expect(screen.getByText(/object/i)).toBeInTheDocument()
  })

  it('round-trips env → json → env', () => {
    render(<EnvToJson />)
    const original = 'FOO=bar\nBAZ=qux'
    fireEvent.change(screen.getByPlaceholderText(/KEY=value/), {
      target: { value: original },
    })
    const json = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value

    // Now flip to json→env
    fireEvent.click(screen.getByRole('tab', { name: 'JSON → .env' }))
    const inputs = document.querySelectorAll('textarea:not([readonly])')
    fireEvent.change(inputs[0], {
      target: { value: json },
    })
    const env = (screen.getByPlaceholderText('Converted output…') as HTMLTextAreaElement).value
    expect(env).toContain('FOO=bar')
    expect(env).toContain('BAZ=qux')
  })
})
