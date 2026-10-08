'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  CopyButton,
  DownloadButton,
  Field,
  FileDrop,
  FilePreview,
  Notice,
  Panel,
  Segmented,
  TextArea,
  TextInput,
  Toolbar,
} from '@/components/ui/kit'
import { fixOverlaps, formatTime, parseSubtitles, parseTime, resync, shift, toSrt, toVtt, type Cue } from '@/lib/subtitles'

type Fmt = 'srt' | 'vtt'
const FORMATS = [
  { value: 'srt', label: 'SRT' },
  { value: 'vtt', label: 'VTT' },
]
const TIME_HINT = 'Enter times as hh:mm:ss,mmm (for example 00:01:02,500).'

function snippet(text: string) {
  const one = text.replace(/\s+/g, ' ').trim()
  return one.length > 48 ? one.slice(0, 47) + '…' : one
}

export default function SubtitleSyncFixer() {
  const [pasted, setPasted] = useState('')
  const [file, setFile] = useState<{ name: string; size: number; text: string } | null>(null)
  const [readError, setReadError] = useState('')
  const [cues, setCues] = useState<Cue[]>([])
  const [fmt, setFmt] = useState<Fmt>('srt')
  const [shiftMs, setShiftMs] = useState('0')
  const [aNum, setANum] = useState('1')
  const [bNum, setBNum] = useState('1')
  const [aTo, setATo] = useState('')
  const [bTo, setBTo] = useState('')
  const [error, setError] = useState('')

  const source = file ? file.text : pasted
  const result = useMemo(() => (source.trim() ? parseSubtitles(source) : null), [source])

  function refreshRefs(list: Cue[], a = aNum, b = bNum) {
    const at = (n: string) => list[Math.min(Math.max(1, parseInt(n, 10) || 1), list.length) - 1]
    if (!list.length) return
    setATo(formatTime(at(a).start))
    setBTo(formatTime(at(b).start))
  }

  useEffect(() => {
    const list = result?.ok ? result.cues : []
    setCues(list)
    setError('')
    if (result?.ok) {
      setFmt(result.format)
      setANum('1')
      setBNum(String(list.length))
      refreshRefs(list, '1', String(list.length))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setReadError('')
    f.text().then(
      (text) => setFile({ name: f.name, size: f.size, text }),
      () => setReadError('Could not read that file.'),
    )
  }

  function cueAt(n: string): Cue | undefined {
    const i = Number(n)
    return Number.isInteger(i) && i >= 1 && i <= cues.length ? cues[i - 1] : undefined
  }

  function pickA(v: string) {
    setANum(v)
    const c = cueAt(v)
    if (c) setATo(formatTime(c.start))
  }
  function pickB(v: string) {
    setBNum(v)
    const c = cueAt(v)
    if (c) setBTo(formatTime(c.start))
  }

  function applyShift() {
    const ms = Number(shiftMs)
    if (!Number.isFinite(ms)) return setError('Enter the shift as a whole number of milliseconds, e.g. 1500 or -800.')
    setError('')
    const next = shift(cues, Math.round(ms))
    setCues(next)
    refreshRefs(next)
  }

  function applyResync() {
    const a = cueAt(aNum)
    const b = cueAt(bNum)
    if (!a || !b) return setError(`Cue numbers must be between 1 and ${cues.length}.`)
    const ta = parseTime(aTo)
    const tb = parseTime(bTo)
    if (ta === null || tb === null) return setError(TIME_HINT)
    if (a.start === b.start && ta !== tb)
      return setError('Pick two cues that start at different times, ideally one near the start and one near the end.')
    setError('')
    setCues(resync(cues, { from: a.start, to: ta }, { from: b.start, to: tb }))
  }

  function applyFix() {
    setError('')
    setCues(fixOverlaps(cues))
  }

  function reset() {
    if (!result?.ok) return
    setError('')
    setCues(result.cues)
    refreshRefs(result.cues)
  }

  const output = cues.length ? (fmt === 'srt' ? toSrt(cues) : toVtt(cues)) : ''
  const base = file ? file.name.replace(/\.(srt|vtt)$/i, '') || 'subtitles' : 'subtitles'
  const refA = cueAt(aNum)
  const refB = cueAt(bNum)
  const refStyle = { fontSize: 13, color: 'var(--mute)', fontFamily: 'var(--font-mono)' }

  return (
    <>
      {file ? (
        <FilePreview name={file.name} meta={`${(file.size / 1024).toFixed(1)} KB`} onRemove={() => setFile(null)} />
      ) : (
        <>
          <FileDrop
            onFiles={onFiles}
            accept=".srt,.vtt,application/x-subrip,text/vtt"
            label="Drop an .srt or .vtt file here, or click to choose"
            hint="Processed on your device"
          />
          <Panel title="Subtitle text">
            <TextArea value={pasted} onChange={setPasted} placeholder="…or paste subtitles (SRT or WebVTT)" rows={6} />
          </Panel>
        </>
      )}

      {readError && <Notice kind="error">{readError}</Notice>}
      {result && !result.ok && <Notice kind="error">{result.error}</Notice>}

      {result?.ok && cues.length > 0 && (
        <>
          <p style={{ margin: '0.25rem 0', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
            {cues.length} cue{cues.length === 1 ? '' : 's'} · read as {result.format.toUpperCase()}
            {result.skipped > 0 && ` · ${result.skipped} malformed cue${result.skipped === 1 ? '' : 's'} skipped`}
          </p>

          <Panel title="Shift all cues">
            <Toolbar>
              <Field label="Shift by (ms)" hint="Positive = later, negative = earlier">
                <TextInput type="number" value={shiftMs} onChange={setShiftMs} />
              </Field>
              <Button onClick={applyShift}>Apply shift</Button>
            </Toolbar>
          </Panel>

          <Panel title="Fix drift (two-point resync)">
            <p style={{ margin: '0 0 0.75rem', color: 'var(--mute)' }}>
              Pick one cue near the start and one near the end, then enter the time each should really start at.
              Everything in between is stretched to match.
            </p>
            <Toolbar>
              <Field label="Cue A number">
                <TextInput type="number" value={aNum} onChange={pickA} />
              </Field>
              <Field label="Cue A should start at" hint="hh:mm:ss,mmm">
                <TextInput value={aTo} onChange={setATo} placeholder="00:00:12,000" />
              </Field>
            </Toolbar>
            {refA && (
              <p style={refStyle}>
                Now {formatTime(refA.start)} — “{snippet(refA.text)}”
              </p>
            )}
            <Toolbar>
              <Field label="Cue B number">
                <TextInput type="number" value={bNum} onChange={pickB} />
              </Field>
              <Field label="Cue B should start at" hint="hh:mm:ss,mmm">
                <TextInput value={bTo} onChange={setBTo} placeholder="01:30:04,000" />
              </Field>
            </Toolbar>
            {refB && (
              <p style={refStyle}>
                Now {formatTime(refB.start)} — “{snippet(refB.text)}”
              </p>
            )}
            <Toolbar>
              <Button variant="primary" onClick={applyResync}>
                Apply resync
              </Button>
              <Button onClick={applyFix}>Fix overlaps</Button>
              <Button onClick={reset}>Reset</Button>
            </Toolbar>
          </Panel>

          {error && <Notice kind="error">{error}</Notice>}

          <Panel
            title="Result"
            actions={
              <>
                <Segmented value={fmt} onChange={(v) => setFmt(v as Fmt)} options={FORMATS} />
                <CopyButton text={output} />
                <DownloadButton
                  text={output}
                  filename={`${base}.synced.${fmt}`}
                  mime={fmt === 'srt' ? 'application/x-subrip;charset=utf-8' : 'text/vtt;charset=utf-8'}
                  label={`Download .${fmt}`}
                />
              </>
            }
          >
            <Field label="Output">
              <TextArea value={output} readOnly rows={12} />
            </Field>
          </Panel>
        </>
      )}
    </>
  )
}
