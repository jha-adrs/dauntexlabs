import { describe, it, expect, vi } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// next/font/google only works inside the Next compiler; stub it so the layout module loads.
vi.mock('next/font/google', () => {
  const font = () => ({ variable: '' })
  return { Bricolage_Grotesque: font, Instrument_Sans: font, IBM_Plex_Mono: font }
})

const OG = join(__dirname, '../../public/og.png')

describe('site-wide OG image', () => {
  it('is a 1200x630 PNG under 100 KB', () => {
    const buf = readFileSync(OG)
    expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG')
    expect(buf.readUInt32BE(16)).toBe(1200)
    expect(buf.readUInt32BE(20)).toBe(630)
    expect(statSync(OG).size).toBeLessThan(100 * 1024)
  })

  it('is referenced from the root layout openGraph and twitter metadata', async () => {
    const { metadata } = await import('@/app/layout')
    const og = metadata.openGraph?.images as { url: string; width: number; height: number; alt: string }[]
    expect(og).toEqual([expect.objectContaining({ url: '/og.png', width: 1200, height: 630 })])
    expect(og[0].alt).toMatch(/dauntexlabs/)
    const tw = metadata.twitter as { card: string; images: string[] }
    expect(tw.card).toBe('summary_large_image')
    expect(tw.images).toEqual(['/og.png'])
  })
})

describe('pages that override openGraph keep the OG image', () => {
  const params = (slug: string) => ({ params: Promise.resolve({ slug }) })
  const imageUrl = (m: { openGraph?: unknown }) =>
    ((m.openGraph as { images?: { url: string }[] })?.images ?? [])[0]?.url

  it('tool, convert and category pages', async () => {
    const tool = await import('@/app/tools/[slug]/page')
    const conv = await import('@/app/convert/[slug]/page')
    const hub = await import('@/app/category/[slug]/page')
    expect(imageUrl(await tool.generateMetadata(params('jwt-tool')))).toBe('/og.png')
    expect(imageUrl(await conv.generateMetadata(params('billions-to-millions')))).toBe('/og.png')
    expect(imageUrl(await hub.generateMetadata(params('india')))).toBe('/og.png')
  })
})
