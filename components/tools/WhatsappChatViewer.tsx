'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { DownloadButton, FileDrop, FilePreview, Notice, Panel, Segmented, Select, TextArea, TextInput, Toolbar } from '@/components/ui/kit'
import { chatToCsv, parseChat, type DateOrder } from '@/lib/whatsapp'

const LARGE = 50 * 1024 * 1024
const PREVIEW_ROWS = 200

const ORDERS: { value: DateOrder; label: string }[] = [
  { value: 'dmy', label: 'Day-first' },
  { value: 'mdy', label: 'Month-first' },
]

const th: CSSProperties = { padding: '0.4rem 0.5rem', fontWeight: 500, textAlign: 'left' }
const td: CSSProperties = { padding: '0.35rem 0.5rem', verticalAlign: 'top' }
const nowrap: CSSProperties = { ...td, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }
const meta: CSSProperties = { margin: '0 0 0.75rem', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }

export default function WhatsappChatViewer() {
  const [pasted, setPasted] = useState('')
  const [file, setFile] = useState<{ name: string; size: number; text: string } | null>(null)
  const [readError, setReadError] = useState('')
  const [order, setOrder] = useState<DateOrder | undefined>()
  const [sender, setSender] = useState('')
  const [query, setQuery] = useState('')

  const source = file ? file.text : pasted
  const result = useMemo(() => (source.trim() ? parseChat(source, order) : null), [source, order])
  const messages = result?.messages ?? []

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const msg of messages) if (msg.sender) m.set(msg.sender, (m.get(msg.sender) ?? 0) + 1)
    return [...m].sort((x, y) => y[1] - x[1])
  }, [messages])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return messages.filter(
      (m) => (!sender || m.sender === sender) && (!q || m.message.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q)),
    )
  }, [messages, sender, query])

  const csv = useMemo(() => (shown.length ? chatToCsv(shown) : ''), [shown])
  const json = useMemo(() => (shown.length ? JSON.stringify(shown, null, 2) : ''), [shown])

  function reset() {
    setOrder(undefined)
    setSender('')
    setQuery('')
  }

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setReadError('')
    reset()
    if (/\.zip$/i.test(f.name)) {
      setReadError('This is a .zip export. Unzip it first, then drop the .txt file inside (on iPhone it is called _chat.txt).')
      return
    }
    f.text().then(
      (text) => setFile({ name: f.name, size: f.size, text }),
      () => setReadError('Could not read that file.'),
    )
  }

  const base = file ? file.name.replace(/\.txt$/i, '') || 'chat' : 'chat'

  return (
    <>
      {file ? (
        <FilePreview name={file.name} meta={`${(file.size / 1024).toFixed(1)} KB`} onRemove={() => { setFile(null); reset() }} />
      ) : (
        <>
          <FileDrop
            onFiles={onFiles}
            accept=".txt,text/plain"
            label="Drop an exported WhatsApp chat (.txt) here, or click to choose"
            hint="Android and iPhone exports — processed on your device. Not affiliated with WhatsApp or Meta."
          />
          <Panel title="Chat text">
            <TextArea
              value={pasted}
              onChange={(v) => { setPasted(v); reset() }}
              placeholder="…or paste the chat text (31/12/2023, 22:15 - Name: message)"
              rows={6}
            />
          </Panel>
        </>
      )}

      {file && file.size > LARGE && (
        <Notice>This file is over 50 MB. It is processed in memory in your browser, so the page may be slow for a moment.</Notice>
      )}
      {readError && <Notice kind="error">{readError}</Notice>}
      {result && messages.length === 0 && (
        <Notice kind="error">
          No WhatsApp messages found. Export the chat from WhatsApp (More → Export chat) and drop the .txt file here.
        </Notice>
      )}

      {messages.length > 0 && result && (
        <>
          {result.ambiguous && (
            <>
              <Notice>
                These dates could be read day-first or month-first (03/04 is 3 April or 4 March). Pick the order your phone uses.
              </Notice>
              <Toolbar>
                <Segmented value={result.order} onChange={(v) => setOrder(v as DateOrder)} options={ORDERS} />
              </Toolbar>
            </>
          )}
          <Toolbar>
            <Select
              value={sender}
              onChange={setSender}
              options={[
                { value: '', label: `All senders (${messages.length})` },
                ...counts.map(([name, n]) => ({ value: name, label: `${name} (${n})` })),
              ]}
            />
            <TextInput value={query} onChange={setQuery} placeholder="Search messages" />
          </Toolbar>

          <Panel
            title="Messages"
            actions={
              <>
                <DownloadButton text={csv ? '﻿' + csv : ''} filename={`${base}.csv`} mime="text/csv;charset=utf-8" label="Download CSV" />
                <DownloadButton text={json} filename={`${base}.json`} mime="application/json" label="Download JSON" />
              </>
            }
          >
            <p style={meta}>
              {messages.length} message{messages.length === 1 ? '' : 's'}
              {shown.length !== messages.length && ` · ${shown.length} match`}
              {shown.length > PREVIEW_ROWS && ` · showing ${PREVIEW_ROWS} of ${shown.length} (downloads include all)`}
            </p>
            {shown.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line-strong)', color: 'var(--mute)' }}>
                      <th style={th}>Date</th>
                      <th style={th}>Time</th>
                      <th style={th}>Sender</th>
                      <th style={th}>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.slice(0, PREVIEW_ROWS).map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--line)', color: m.type === 'text' ? undefined : 'var(--mute)' }}>
                        <td style={nowrap}>{m.date}</td>
                        <td style={nowrap}>{m.time}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{m.sender}</td>
                        <td style={{ ...td, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </>
  )
}
