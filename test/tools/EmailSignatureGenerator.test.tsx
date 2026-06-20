import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmailSignatureGenerator from '@/components/tools/EmailSignatureGenerator'

function getHtml(): string {
  // the readOnly HTML textarea is the only mono textarea in this tool
  const areas = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
  const ta = areas.find((a) => a.readOnly)
  return ta?.value ?? ''
}

describe('EmailSignatureGenerator', () => {
  it('generates HTML containing the name and a mailto link', () => {
    render(<EmailSignatureGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Ada Lovelace'), {
      target: { value: 'Ada Lovelace' },
    })
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'ada@x.com' },
    })

    const html = getHtml()
    expect(html).toContain('Ada Lovelace')
    expect(html).toContain('mailto:ada@x.com')
  })

  it('escapes HTML special characters in field values', () => {
    render(<EmailSignatureGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Ada Lovelace'), {
      target: { value: '<script>x</script>' },
    })
    const html = getHtml()
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('renders a live preview node from the generated HTML', () => {
    render(<EmailSignatureGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Ada Lovelace'), {
      target: { value: 'Grace Hopper' },
    })
    expect(screen.getByText('LIVE PREVIEW')).toBeInTheDocument()
    // name should appear in the rendered preview as well (multiple occurrences ok)
    expect(screen.getAllByText('Grace Hopper').length).toBeGreaterThan(0)
  })

  it('prefixes a scheme-less website with https in the href', () => {
    render(<EmailSignatureGenerator />)
    fireEvent.change(screen.getByPlaceholderText('example.com'), {
      target: { value: 'mysite.io' },
    })
    expect(getHtml()).toContain('href="https://mysite.io"')
  })

  it('shows a prompt when all fields are cleared', () => {
    render(<EmailSignatureGenerator />)
    const fields = [
      'Ada Lovelace',
      'Lead Engineer',
      'Acme Inc.',
      'you@example.com',
      '+1 555 0100',
      'example.com',
      'Building better tools',
    ]
    for (const ph of fields) {
      fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: '' } })
    }
    expect(screen.getByText(/Fill in at least one field/i)).toBeInTheDocument()
  })
})
