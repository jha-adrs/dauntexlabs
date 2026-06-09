'use client'

// Shared UI kit for tools. Every tool composes these primitives so the whole
// library stays visually consistent with the "Instrument Deck" design system.
// All styling lives in app/globals.css (the `tool kit` section).

import { useRef, useState, type ReactNode } from 'react'

/* ---- buttons ------------------------------------------------------- */

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  title?: string
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  type = 'button',
  disabled,
  title,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}

/** Copies `text` to the clipboard with a graceful fallback + "copied" feedback. */
export function CopyButton({ text, label = 'copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)

  async function copy() {
    if (!text) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setDone(true)
      setTimeout(() => setDone(false), 1500)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!text}>
      {done ? '✓ copied' : label}
    </button>
  )
}

/** Triggers a client-side download of `text` as a file (no server involved). */
export function DownloadButton({
  text,
  filename,
  mime = 'text/plain',
  label = 'download',
}: {
  text: string
  filename: string
  mime?: string
  label?: string
}) {
  function download() {
    if (!text) return
    const blob = new Blob([text], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={download} disabled={!text}>
      {label}
    </button>
  )
}

/* ---- inputs -------------------------------------------------------- */

export function Field({
  label,
  hint,
  children,
}: {
  label?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 10,
  readOnly = false,
  mono = true,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  rows?: number
  readOnly?: boolean
  mono?: boolean
}) {
  return (
    <textarea
      className={`ta ${mono ? 'mono' : ''}`}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      spellCheck={false}
      autoComplete="off"
    />
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: 'text' | 'password' | 'number'
}) {
  return (
    <input
      className="inp"
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      autoComplete="off"
    />
  )
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange?: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select className="sel" value={value} onChange={(e) => onChange?.(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange?: (v: boolean) => void
  label: string
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="toggle-box" />
      <span>{label}</span>
    </label>
  )
}

/** Mode switcher (segmented control). */
export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---- layout + feedback -------------------------------------------- */

/** Options row above the panels. */
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar">{children}</div>
}

/** Two-column responsive input/output area; pass two <Panel>s as children. */
export function IO({ children }: { children: ReactNode }) {
  return <div className="tool-io">{children}</div>
}

export function Panel({
  title,
  actions,
  children,
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="panel">
      <header className="panel-head">
        <span className="panel-title">{title}</span>
        {actions && <span className="panel-actions">{actions}</span>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}

export function Notice({
  kind = 'info',
  children,
}: {
  kind?: 'info' | 'error' | 'success'
  children: ReactNode
}) {
  if (!children) return null
  return <div className={`notice ${kind}`}>{children}</div>
}

/* ---- files (for image / PDF tools) -------------------------------- */

/** Download arbitrary binary data as a file, entirely client-side. */
export function downloadBlob(
  data: Blob | ArrayBuffer | Uint8Array,
  filename: string,
  mime = 'application/octet-stream',
) {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Drag-and-drop + click file picker. Calls onFiles with the chosen File[]. */
export function FileDrop({
  onFiles,
  accept,
  multiple = false,
  label = 'Drop a file here, or click to choose',
  hint,
}: {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  label?: string
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  function pick(list: FileList | null) {
    if (!list || !list.length) return
    onFiles(Array.from(list))
  }

  return (
    <div
      className={`filedrop${over ? ' over' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        pick(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
      <span className="filedrop-icon" aria-hidden>
        ⬗
      </span>
      <span className="filedrop-label">{label}</span>
      {hint && <span className="filedrop-hint">{hint}</span>}
    </div>
  )
}

/** A compact chip describing a selected file, with optional thumbnail + remove. */
export function FilePreview({
  name,
  meta,
  thumbUrl,
  onRemove,
}: {
  name: string
  meta?: string
  thumbUrl?: string
  onRemove?: () => void
}) {
  return (
    <div className="filechip">
      {thumbUrl && <img className="filechip-thumb" src={thumbUrl} alt="" />}
      <span className="filechip-body">
        <span className="filechip-name">{name}</span>
        {meta && <span className="filechip-meta">{meta}</span>}
      </span>
      {onRemove && (
        <button className="filechip-x" onClick={onRemove} aria-label="Remove file">
          ✕
        </button>
      )}
    </div>
  )
}
