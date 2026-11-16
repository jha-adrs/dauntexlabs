// Parser for exported WhatsApp chats (.txt). There is no official format spec; the
// line shapes follow those documented by the open-source parsers whatstk, wc-parser
// and whatsapp-chat-parser:
//   Android  12/31/23, 10:15 PM - Alice: Hello      31.12.23, 22.15 - Bob: Hallo
//            2023-12-31 22:15 - Bob: Hej
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

// Either day/month/year in some order (a, b, y) or year-first (Y, M, D).
const DATE = String.raw`(?:(?<a>\d{1,2})[/.\-](?<b>\d{1,2})[/.\-](?<y>\d{2}|\d{4})|(?<Y>\d{4})[/.\-](?<M>\d{1,2})[/.\-](?<D>\d{1,2})),?\s+`
// \s already covers U+00A0 and U+202F (iOS puts the latter before AM/PM).
const TIME = String.raw`(?<h>\d{1,2})[:.](?<min>\d{2})(?:[:.](?<sec>\d{2}))?(?:\s*(?<ampm>[ap])\.?\s?m\.?)?`
const BRACKETED = new RegExp(String.raw`^\[${DATE}${TIME}\]\s*(?<rest>.*)$`, 'i')
const DASHED = new RegExp(String.raw`^${DATE}${TIME}\s+[-\u2013]\s+(?<rest>.*)$`, 'i')
const SENDER = /^([^:]+?):(?: (.*)|$)/
const QUOTES = /["\u201c\u201d]/
const MARKS = /^[\u200e\u200f\ufeff]+/
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
  yearFirst: boolean
  time: string
  sender: string
  message: string
  type: MessageType
}

const pad = (n: number) => String(n).padStart(2, '0')
const stripMarks = (s: string) => s.replace(MARKS, '')

function header(line: string): Raw | null {
  const g = (BRACKETED.exec(line) ?? DASHED.exec(line))?.groups
  if (!g) return null
  const yearFirst = g.Y !== undefined
  // For year-first dates a = day and b = month, so the date builder treats them as dmy.
  const a = Number(yearFirst ? g.D : g.a)
  const b = Number(yearFirst ? g.M : g.b)
  let hour = Number(g.h)
  const min = Number(g.min)
  if (a < 1 || b < 1 || a > 31 || b > 31 || (a > 12 && b > 12) || (yearFirst && b > 12)) return null
  if (min > 59 || hour > (g.ampm ? 12 : 23)) return null
  if (g.ampm) {
    hour = hour % 12
    if (g.ampm.toLowerCase() === 'p') hour += 12
  }
  const y = yearFirst ? g.Y : g.y
  const year = y.length === 2 ? 2000 + Number(y) : Number(y)
  const time = `${pad(hour)}:${pad(min)}:${pad(Number(g.sec ?? 0))}`

  // iOS marks group notices with a leading U+200E; a "sender" with quotes in it is
  // really a notice such as: Alice changed the group name to "Trip: Goa".
  const notice = MARKS.test(g.rest)
  const body = stripMarks(g.rest)
  const s = notice ? null : SENDER.exec(body)
  if (!s || QUOTES.test(s[1])) return { a, b, year, yearFirst, time, sender: '', message: body, type: 'system' }
  const message = stripMarks(s[2] ?? '')
  const type: MessageType = MEDIA.some((re) => re.test(message.trim())) ? 'media' : 'text'
  return { a, b, year, yearFirst, time, sender: s[1].trim(), message, type }
}

/** Parse an exported chat. `order` forces day-first or month-first dates. Never throws. */
export function parseChat(text: string, order?: DateOrder): ParsedChat {
  const raws: Raw[] = []
  for (const rawLine of text.replace(MARKS, '').split(/\r\n|\r|\n/)) {
    const h = header(stripMarks(rawLine))
    if (h) raws.push(h)
    else if (raws.length) raws[raws.length - 1].message += '\n' + rawLine
  }
  // Trailing blank lines from the final newline are not part of the last message.
  if (raws.length) {
    const last = raws[raws.length - 1]
    last.message = last.message.replace(/\n+$/, '')
  }

  const ordered = raws.filter((r) => !r.yearFirst)
  const dayFirst = ordered.some((r) => r.a > 12)
  const monthFirst = !dayFirst && ordered.some((r) => r.b > 12)
  const ambiguous = ordered.length > 0 && !dayFirst && !monthFirst
  const used: DateOrder = order ?? (monthFirst ? 'mdy' : 'dmy')

  const messages = raws.map(({ a, b, year, yearFirst, time, sender, message, type }) => {
    const [day, month] = yearFirst || used === 'dmy' ? [a, b] : [b, a]
    return { date: `${year}-${pad(month)}-${pad(day)}`, time, sender, message, type }
  })
  return { messages, order: used, ambiguous }
}

/** CSV with header `Date,Time,Sender,Message,Type`, CRLF ends, formula cells neutralised. */
export function chatToCsv(messages: ChatMessage[]): string {
  return toCsv([['Date', 'Time', 'Sender', 'Message', 'Type'], ...messages.map((m) => [m.date, m.time, m.sender, m.message, m.type])])
}
