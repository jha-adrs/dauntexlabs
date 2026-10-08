import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HarSanitizer from '@/components/tools/HarSanitizer'

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.componentSig_1'
const COOKIE = 'cookieSecretValue1234'
const KEY = 'apiKeySecretValue5678'

const HAR = JSON.stringify({
  log: {
    entries: [
      {
        request: {
          url: 'https://api.example.com/x?page=2',
          headers: [
            { name: 'Cookie', value: `sid=${COOKIE}` },
            { name: 'X-Api-Key', value: KEY },
          ],
          cookies: [],
        },
        response: { headers: [], content: { mimeType: 'text/plain', text: `token is ${JWT}` } },
      },
    ],
  },
})

function paste(text: string) {
  fireEvent.change(screen.getByPlaceholderText(/paste har/i), { target: { value: text } })
}

describe('HarSanitizer', () => {
  it('lists findings masked, grouped by category, with a redaction count', () => {
    render(<HarSanitizer />)
    paste(HAR)
    expect(screen.getByText('3 values will be redacted')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /cookies/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /drop request and response bodies/i })).not.toBeChecked()
    const shown = document.body.cloneNode(true) as HTMLElement
    shown.querySelectorAll('textarea').forEach((t) => t.remove()) // the user's own input
    const page = shown.textContent ?? ''
    for (const s of [JWT, COOKIE, KEY]) expect(page).not.toContain(s)
    expect(page).toContain('api… (21 chars)')
  })

  it('updates the count when a category is switched off', () => {
    render(<HarSanitizer />)
    paste(HAR)
    fireEvent.click(screen.getByRole('checkbox', { name: /cookies/i }))
    expect(screen.getByText('2 values will be redacted')).toBeInTheDocument()
  })

  it('downloads a sanitized HAR without the secrets', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const { container } = render(<HarSanitizer />)
    const file = new File([HAR], 'session.har', { type: 'application/json' })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })
    await screen.findByText('3 values will be redacted')
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /download sanitized har/i }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    const out = await (spy.mock.calls.at(-1)![0] as Blob).text()
    for (const s of [JWT, COOKIE, KEY]) expect(out).not.toContain(s)
    expect(out).toContain('page=2')
    expect(revoke).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('shows an error for text that is not a HAR', () => {
    render(<HarSanitizer />)
    paste('{"hello":1}')
    expect(screen.getByText(/no log\.entries/i)).toBeInTheDocument()
  })
})
