// Parser for exported WhatsApp chats (.txt). There is no official format spec; the
// line shapes follow those documented by the open-source parsers whatstk, wc-parser
// and whatsapp-chat-parser:
//   Android  12/31/23, 10:15 PM - Alice: Hello      31.12.23, 22:15 - Bob: Hallo
//   iOS      [31/12/23, 10:15:32 PM] Alice: Hello   (often with U+200E / U+202F)
// Timestamps are kept as written (no time-zone conversion).

import { toCsv } from './csv-write'

export type DateOrder = 'dmy' | 'mdy'
export type MessageType = 'text' | 'media' | 'system'

export interface ChatMessage {
  date: string // YYYY-MM-DD
  time: string // HH:MM:SS, 24 h
  sender: string
  message: string
  type: MessageType
}

export interface ParsedChat {
  messages: ChatMessage[]
  order: DateOrder
  ambiguous: boolean
}

const DATE = String.raw`(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4}),?\s+`
const TIME = String.raw`(\d{1,2}):(\d{2})(?::(\d{2}))?(?:[\s  ]*([ap])\.?\s?m\.?)?`
const BRACKETED = new RegExp(String.raw`^\[${DATE}${TIME}\]\s*(.*)$`, 'i')
const DASHED = new RegExp(String.raw`^${DATE}${TIME}\s+[-–]\s+(.*)$`, 'i')
const SENDER = /^([^:]+?):(?: (.*)|$)/
const MEDIA = [
  /^<Media omitted>$/i,
  /\b(image|video|audio|sticker|gif|document|contact card) omitted$/i,
  /\(file attached\)$/i,
  /^<attached: [^>]*>$/i,
]

interface Raw {
  a: number
  b: number
  year: number
  time: string
  sender: string
  message: string
  type: MessageType
}

const pad = (n: number) => String(n).padStart(2, '0')
const stripMarks = (s: string) => s.replace(/^[‎‏﻿]+/, '')

function header(line: string): Raw | null {
  const m = BRACKETED.exec(line) ?? DASHED.exec(line)
  if (!m) return null
  const [, a, b, y, h, min, sec, ampm, rest] = m
  let hour = Number(h)
  if (hour > 23 || Number(min) > 59) return null
  if (ampm) {
    hour = hour % 12
    if (ampm.toLowerCase() === 'p') hour += 12
  }
  const year = y.length === 2 ? 2000 + Number(y) : Number(y)
  const body = stripMarks(rest)
  const s = SENDER.exec(body)
  const sender = s ? s[1].trim() : ''
  const message = s ? stripMarks(s[2] ?? '') : body
  const type: MessageType = !s ? 'system' : MEDIA.some((re) => re.test(message.trim())) ? 'media' : 'text'
  return { a: Number(a), b: Number(b), year, time: `${pad(hour)}:${min}:${pad(Number(sec ?? 0))}`, sender, message, type }
}

/** Parse an exported chat. `order` forces day-first or month-first dates. Never throws. */
export function parseChat(text: string, order?: DateOrder): ParsedChat {
  const raws: Raw[] = []
  for (const rawLine of text.replace(/^﻿/, '').split(/\r\n|\r|\n/)) {
    const line = stripMarks(rawLine)
    const h = header(line)
    if (h) raws.push(h)
    else if (raws.length) raws[raws.length - 1].message += '\n' + rawLine
  }
  // Trailing blank lines from the final newline are not part of the last message.
  if (raws.length) {
    const last = raws[raws.length - 1]
    last.message = last.message.replace(/\n+$/, '')
  }

  const dayFirst = raws.some((r) => r.a > 12)
  const monthFirst = !dayFirst && raws.some((r) => r.b > 12)
  const ambiguous = !dayFirst && !monthFirst
  const used: DateOrder = order ?? (monthFirst ? 'mdy' : 'dmy')

  const messages = raws.map(({ a, b, year, time, sender, message, type }) => {
    const [day, month] = used === 'dmy' ? [a, b] : [b, a]
    return { date: `${year}-${pad(month)}-${pad(day)}`, time, sender, message, type }
  })
  return { messages, order: used, ambiguous }
}

/** CSV with header `Date,Time,Sender,Message,Type`, CRLF ends, formula cells neutralised. */
export function chatToCsv(messages: ChatMessage[]): string {
  return toCsv([['Date', 'Time', 'Sender', 'Message', 'Type'], ...messages.map((m) => [m.date, m.time, m.sender, m.message, m.type])])
}
