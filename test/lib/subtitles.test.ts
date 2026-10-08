import { describe, it, expect } from 'vitest'
import { fixOverlaps, formatTime, parseSubtitles, parseTime, resync, shift, toSrt, toVtt, type Cue } from '@/lib/subtitles'

const SRT = '﻿1\r\n00:00:01,000 --> 00:00:02,500\r\nHello\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\nLine one\r\nLine two\r\n'

const VTT = [
  'WEBVTT - some title',
  '',
  'NOTE this is a comment',
  'spanning two lines',
  '',
  'intro',
  '00:00:01.000 --> 00:00:02.000 line:0 align:start',
  'Hi there',
  '',
  '00:05.250 --> 00:06.000',
  'Short form',
].join('\n')

function ok(text: string) {
  const r = parseSubtitles(text)
  if (!r.ok) throw new Error(r.error)
  return r
}

describe('parseTime', () => {
  it('reads SRT, VTT and short forms', () => {
    expect(parseTime('00:01:02,500')).toBe(62500)
    expect(parseTime('01:02:03.004')).toBe(3723004)
    expect(parseTime('01:02.500')).toBe(62500)
    expect(parseTime('nope')).toBeNull()
    expect(parseTime('00:61:00,000')).toBeNull()
  })
  it('formats back', () => {
    expect(formatTime(3723004, ',')).toBe('01:02:03,004')
    expect(formatTime(500, '.')).toBe('00:00:00.500')
  })
})

describe('parseSubtitles', () => {
  it('parses SRT with BOM + CRLF and multi-line text', () => {
    const r = ok(SRT)
    expect(r.format).toBe('srt')
    expect(r.skipped).toBe(0)
    expect(r.cues).toEqual([
      { start: 1000, end: 2500, text: 'Hello' },
      { start: 3000, end: 4000, text: 'Line one\nLine two' },
    ])
  })
  it('parses VTT with header, NOTE block, cue settings and ids', () => {
    const r = ok(VTT)
    expect(r.format).toBe('vtt')
    expect(r.cues).toEqual([
      { start: 1000, end: 2000, text: 'Hi there' },
      { start: 5250, end: 6000, text: 'Short form' },
    ])
  })
  it('skips a malformed cue and counts it', () => {
    const bad = SRT + '\r\n3\r\n00:00:xx --> later\r\nBroken\r\n'
    const r = ok(bad)
    expect(r.cues).toHaveLength(2)
    expect(r.skipped).toBe(1)
  })
  it('errors on text with no cues', () => {
    expect(parseSubtitles('just some words').ok).toBe(false)
  })
})

const cues: Cue[] = [
  { start: 1000, end: 2000, text: 'a' },
  { start: 10000, end: 11000, text: 'b' },
]

describe('shift / resync / fixOverlaps', () => {
  it('shifts and clamps at 0', () => {
    expect(shift(cues, 1500)[0]).toEqual({ start: 2500, end: 3500, text: 'a' })
    expect(shift(cues, -5000)[0]).toEqual({ start: 0, end: 0, text: 'a' })
    expect(shift(cues, -5000)[1].start).toBe(5000)
  })
  it('linearly maps two reference points', () => {
    const out = resync([{ start: 55000, end: 56000, text: 'x' }], { from: 10000, to: 12000 }, { from: 100000, to: 104000 })
    expect(out[0].start).toBe(58000)
    expect(out[0].end).toBe(59022)
  })
  it('falls back to a shift when both points share a time', () => {
    expect(resync(cues, { from: 1000, to: 2000 }, { from: 1000, to: 9000 })[0].start).toBe(2000)
  })
  it('sorts and trims overlaps', () => {
    const out = fixOverlaps([
      { start: 5000, end: 9000, text: 'later' },
      { start: 1000, end: 6000, text: 'first' },
    ])
    expect(out.map((c) => c.text)).toEqual(['first', 'later'])
    expect(out[0].end).toBe(4999)
    expect(out[1].end).toBe(9000)
  })
})

describe('serialise', () => {
  it('toSrt renumbers from 1 with comma milliseconds', () => {
    expect(toSrt(ok(VTT).cues)).toBe(
      '1\n00:00:01,000 --> 00:00:02,000\nHi there\n\n2\n00:00:05,250 --> 00:00:06,000\nShort form\n',
    )
  })
  it('toVtt starts with WEBVTT and uses dots', () => {
    const v = toVtt(ok(SRT).cues)
    expect(v.startsWith('WEBVTT\n\n')).toBe(true)
    expect(v).toContain('00:00:03.000 --> 00:00:04.000\nLine one\nLine two')
    expect(v).not.toContain(',')
  })
})
