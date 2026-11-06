import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConvertPage from '@/app/convert/[slug]/page'

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

describe('convert page worked examples', () => {
  it('renders query-phrased worked examples in the static HTML', async () => {
    const { container } = render(await ConvertPage(params('billions-to-millions')))
    expect(screen.getByRole('heading', { level: 2, name: 'Billion in million: common values' })).toBeTruthy()
    expect(container.textContent).toContain('1.49 billion in million = 1490 million')
  })

  it('uses the plural unit words for measurement pairs', async () => {
    const { container } = render(await ConvertPage(params('fluid-ounces-to-gallons')))
    expect(screen.getByRole('heading', { level: 2, name: 'Fluid ounces in gallons: common values' })).toBeTruthy()
    expect(container.textContent).toContain('128 fluid ounces in gallons = 1 gal')
  })

  it('omits the section on commodity pages', async () => {
    render(await ConvertPage(params('kilometers-to-miles')))
    expect(screen.queryByRole('heading', { level: 2, name: /common values/ })).toBeNull()
  })
})
