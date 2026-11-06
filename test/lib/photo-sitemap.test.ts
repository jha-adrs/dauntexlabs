import { describe, it, expect } from 'vitest'
import sitemap from '@/app/sitemap'
import { PHOTO_PRESETS } from '@/lib/photo-presets'
import { tools } from '@/lib/tools'
import { TOOL_CONTENT } from '@/lib/tool-content'
import { HUBS } from '@/lib/hubs'

describe('photo wiring', () => {
  const urls = sitemap().map((e) => e.url)
  it('sitemap has the hub and every preset page', () => {
    expect(urls).toContain('https://dauntexlabs.com/photo/')
    expect(urls.filter((u) => u.startsWith('https://dauntexlabs.com/photo/') && u !== 'https://dauntexlabs.com/photo/')).toHaveLength(PHOTO_PRESETS.length)
  })
  it('registers the India tool with content', () => {
    expect(tools.find((t) => t.slug === 'exam-photo-resizer')?.category).toBe('India')
    expect(TOOL_CONTENT['exam-photo-resizer']).toBeDefined()
  })
  it('India hub mentions exam photo sizes', () => {
    const india = HUBS.find((h) => h.slug === 'india')!
    expect([...india.intro, ...india.faq.map((f) => f.q + f.a)].join(' ')).toMatch(/exam photo/i)
  })
})
