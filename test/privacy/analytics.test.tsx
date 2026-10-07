import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { sanitisedPageView } from '@/components/Analytics'

vi.mock('next/navigation', () => ({ usePathname: () => '/tools/aadhaar-masker/' }))

describe('analytics page views', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('sends only origin + path — never the query string or fragment', () => {
    window.history.replaceState(null, '', '/tools/aadhaar-masker/?q=secret#q=secret')
    const pv = sanitisedPageView()
    expect(pv.page_location).toBe(`${window.location.origin}/tools/aadhaar-masker/`)
    expect(pv.page_path).toBe('/tools/aadhaar-masker/')
    expect(JSON.stringify(pv)).not.toContain('secret')
  })

  it('reduces the referrer to its origin', () => {
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://example.com/search?q=secret')
    expect(sanitisedPageView().page_referrer).toBe('https://example.com')
  })

  it('sends a sanitised page_view through gtag on mount', async () => {
    window.history.replaceState(null, '', '/tools/aadhaar-masker/#q=secret')
    const gtag = vi.fn()
    ;(window as unknown as { gtag: unknown }).gtag = gtag
    const { default: Analytics } = await import('@/components/Analytics')
    render(<Analytics />)
    const call = gtag.mock.calls.find((c) => c[0] === 'event' && c[1] === 'page_view')
    expect(call).toBeDefined()
    expect(JSON.stringify(call)).not.toContain('secret')
  })
})

describe('GA config', () => {
  it('pins page_location and page_referrer for every event gtag sends, not just page_view', async () => {
    const { default: Analytics } = await import('@/components/Analytics')
    const { container } = render(<Analytics />)
    const init = container.querySelector('#ga-consent-init')!.innerHTML
    expect(init).toContain('send_page_view: false')
    expect(init).toMatch(/page_location:\s*location\.origin \+ location\.pathname/)
    expect(init).toMatch(/page_referrer:/)
  })
})
