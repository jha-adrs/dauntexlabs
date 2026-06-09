import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import JwtTool from '@/components/tools/JwtTool'

// A static HS256 token signed with secret "my-secret":
//   header  = { alg: "HS256", typ: "JWT" }
//   payload = { sub: "1234567890", name: "Jane Doe", iat: 1516239022 }
// (No `exp`, so no expiry notice fires.)
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.vdiPMXjRf8orAkByHfNK6pcpsJJ-EDy62ihzOV2Cre4'
const SECRET = 'my-secret'

describe('JwtTool', () => {
  it('decodes a token into header and payload JSON', async () => {
    render(<JwtTool />) // defaults to Decode tab
    fireEvent.change(
      screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/),
      { target: { value: TOKEN } },
    )

    // Two readOnly textareas appear: header panel + payload panel.
    await waitFor(() => {
      const areas = document.querySelectorAll<HTMLTextAreaElement>('textarea[readonly]')
      expect(areas.length).toBe(2)
    })
    const areas = Array.from(
      document.querySelectorAll<HTMLTextAreaElement>('textarea[readonly]'),
    )
    const headerText = areas[0].value
    const payloadText = areas[1].value

    expect(headerText).toContain('"alg": "HS256"')
    expect(headerText).toContain('"typ": "JWT"')
    expect(payloadText).toContain('"sub": "1234567890"')
    expect(payloadText).toContain('"name": "Jane Doe"')
    expect(JSON.parse(payloadText)).toMatchObject({
      sub: '1234567890',
      name: 'Jane Doe',
      iat: 1516239022,
    })

    // The iat time claim is humanized in the "time claims" panel.
    expect(screen.getByText(/iat: 1516239022/)).toBeInTheDocument()
  })

  it('shows an error for a non-JWT string in Decode', () => {
    render(<JwtTool />)
    fireEvent.change(
      screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/),
      { target: { value: 'not-a-jwt' } },
    )
    expect(document.querySelector('.notice.error')).toBeInTheDocument()
  })

  it('verifies a known token + secret as valid (HS256)', async () => {
    render(<JwtTool />)
    fireEvent.click(screen.getByRole('tab', { name: 'Verify' }))

    fireEvent.change(screen.getByPlaceholderText('header.payload.signature'), {
      target: { value: TOKEN },
    })
    fireEvent.change(screen.getByPlaceholderText('HMAC shared secret'), {
      target: { value: SECRET },
    })

    expect(
      await screen.findByText(/Signature valid \(HS256\)\./),
    ).toBeInTheDocument()
  })

  it('reports an invalid signature for the wrong secret', async () => {
    render(<JwtTool />)
    fireEvent.click(screen.getByRole('tab', { name: 'Verify' }))

    fireEvent.change(screen.getByPlaceholderText('header.payload.signature'), {
      target: { value: TOKEN },
    })
    fireEvent.change(screen.getByPlaceholderText('HMAC shared secret'), {
      target: { value: 'wrong-secret' },
    })

    expect(
      await screen.findByText(/Signature does NOT match/i),
    ).toBeInTheDocument()
  })

  it('signs a token (3 dot-separated segments) and the sign→verify round-trips', async () => {
    render(<JwtTool />)
    fireEvent.click(screen.getByRole('tab', { name: 'Sign' }))

    // Sign tab pre-fills header/payload JSON; just set a secret and sign.
    fireEvent.change(screen.getByPlaceholderText('HMAC shared secret'), {
      target: { value: SECRET },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign token' }))

    // The signed-token panel appears with a readOnly textarea.
    let produced = ''
    await waitFor(() => {
      const panel = screen.getByText('signed token').closest('.panel') as HTMLElement
      const ta = panel.querySelector('textarea') as HTMLTextAreaElement
      expect(ta.value).not.toBe('')
      produced = ta.value
    })
    const segments = produced.split('.')
    expect(segments).toHaveLength(3)
    segments.forEach((seg) => expect(seg.length).toBeGreaterThan(0))

    // Round trip: verifying the produced token with the same secret is valid.
    fireEvent.click(screen.getByRole('tab', { name: 'Verify' }))
    fireEvent.change(screen.getByPlaceholderText('header.payload.signature'), {
      target: { value: produced },
    })
    fireEvent.change(screen.getByPlaceholderText('HMAC shared secret'), {
      target: { value: SECRET },
    })
    expect(
      await screen.findByText(/Signature valid \(HS256\)\./),
    ).toBeInTheDocument()
  })

  it('reports a JSON error when signing with malformed header/payload', async () => {
    render(<JwtTool />)
    fireEvent.click(screen.getByRole('tab', { name: 'Sign' }))

    // The header (JSON) panel holds the first non-readonly textarea.
    const headerPanel = screen.getByText('header (JSON)').closest('.panel') as HTMLElement
    const headerTa = within(headerPanel).getByRole('textbox') as HTMLTextAreaElement
    fireEvent.change(headerTa, { target: { value: '{ not json' } })
    fireEvent.change(screen.getByPlaceholderText('HMAC shared secret'), {
      target: { value: SECRET },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign token' }))

    expect(
      await screen.findByText(/Header or payload is not valid JSON\./),
    ).toBeInTheDocument()
  })
})
