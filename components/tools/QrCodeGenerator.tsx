'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Button,
  CopyButton,
  downloadBlob,
  Field,
  FileDrop,
  FilePreview,
  IO,
  Notice,
  Panel,
  Segmented,
  Select,
  TextArea,
  TextInput,
  Toggle,
  Toolbar,
} from '@/components/ui/kit'
import { buildPayload, type QrType } from '@/lib/qr/payloads'
import { makeMatrix, type Ec, type QrMatrix } from '@/lib/qr/matrix'
import { PRESETS, renderSvg, type EyeBall, type EyeFrame, type ModuleShape, type QrStyle } from '@/lib/qr/render-svg'
import { scanWarnings } from '@/lib/qr/contrast'
import { svgToBlob } from '@/lib/qr/export'

/* ---- content types + their fields --------------------------------- */

type FieldDef = {
  key: string
  label: string
  kind?: 'text' | 'textarea' | 'datetime' | 'security' | 'hidden'
  placeholder?: string
  hint?: string
}

const TYPES: { value: QrType; label: string }[] = [
  { value: 'url', label: 'Link (URL)' },
  { value: 'text', label: 'Plain text' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'vcard', label: 'Contact (vCard)' },
  { value: 'mecard', label: 'Contact (MeCard)' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'phone', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'geo', label: 'Location' },
  { value: 'event', label: 'Calendar event' },
  { value: 'upi', label: 'UPI payment' },
]

const FIELDS: Record<QrType, FieldDef[]> = {
  url: [{ key: 'url', label: 'Link', placeholder: 'https://example.com' }],
  text: [{ key: 'text', label: 'Text', kind: 'textarea', placeholder: 'Any text…' }],
  wifi: [
    { key: 'ssid', label: 'Network name (SSID)', placeholder: 'HomeWiFi' },
    { key: 'security', label: 'Security', kind: 'security' },
    { key: 'password', label: 'Password' },
    { key: 'hidden', label: 'Hidden network', kind: 'hidden' },
  ],
  vcard: [
    { key: 'name', label: 'Full name', placeholder: 'Asha Rao' },
    { key: 'phone', label: 'Phone', placeholder: '+91 98450 00000' },
    { key: 'email', label: 'Email', placeholder: 'asha@example.com' },
    { key: 'org', label: 'Company' },
    { key: 'url', label: 'Website' },
  ],
  mecard: [
    { key: 'name', label: 'Name', placeholder: 'Asha Rao' },
    { key: 'phone', label: 'Phone', placeholder: '+91 98450 00000' },
    { key: 'email', label: 'Email' },
  ],
  email: [
    { key: 'to', label: 'To', placeholder: 'name@example.com' },
    { key: 'subject', label: 'Subject' },
    { key: 'body', label: 'Message', kind: 'textarea' },
  ],
  sms: [
    { key: 'phone', label: 'Phone number', placeholder: '+91 98450 00000' },
    { key: 'message', label: 'Message', kind: 'textarea' },
  ],
  phone: [{ key: 'phone', label: 'Phone number', placeholder: '+91 98450 00000' }],
  whatsapp: [
    { key: 'phone', label: 'WhatsApp number', placeholder: '+91 98450 00000', hint: 'With country code' },
    { key: 'text', label: 'Prefilled message', kind: 'textarea' },
  ],
  geo: [
    { key: 'lat', label: 'Latitude', placeholder: '12.9716' },
    { key: 'lon', label: 'Longitude', placeholder: '77.5946' },
  ],
  event: [
    { key: 'title', label: 'Event title' },
    { key: 'start', label: 'Starts', kind: 'datetime' },
    { key: 'end', label: 'Ends', kind: 'datetime' },
    { key: 'location', label: 'Location' },
  ],
  upi: [
    { key: 'pa', label: 'UPI ID', placeholder: 'name@okhdfc' },
    { key: 'pn', label: 'Payee name', placeholder: 'Shop name' },
    { key: 'am', label: 'Amount (optional)', placeholder: '150.00', hint: 'In rupees, up to ₹1,00,000. Leave empty to let the payer enter it.' },
    { key: 'tn', label: 'Note', placeholder: 'Order 42' },
  ],
}

const DEFAULTS: Partial<Record<QrType, Record<string, string>>> = { wifi: { security: 'WPA', hidden: 'false' } }

/* ---- design options ------------------------------------------------ */

const MODULES: { value: ModuleShape; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'classy', label: 'Classy' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'vbars', label: 'Vertical bars' },
  { value: 'hbars', label: 'Horizontal bars' },
  { value: 'fluid', label: 'Fluid' },
]
const FRAMES: { value: EyeFrame; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
  { value: 'leaf', label: 'Leaf' },
]
const BALLS: { value: EyeBall; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' },
]
const EC_OPTIONS = [
  { value: 'L', label: 'L — low (7%)' },
  { value: 'M', label: 'M — medium (15%)' },
  { value: 'Q', label: 'Q — quartile (25%)' },
  { value: 'H', label: 'H — high (30%)' },
]
const PNG_SIZES = ['256', '512', '1024', '2048', '4096'].map((v) => ({ value: v, label: `${v} px` }))
const MAX_LOGO = 2 * 1024 * 1024

/** A labelled group for controls that are not a single input (avoids wrapping buttons in a <label>). */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
    </div>
  )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 56, height: 36, padding: 2, border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)' }}
      />
    </Field>
  )
}

const row = { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' } as const
const warnBox = { color: 'var(--warn)', background: 'var(--warn-tint)', borderColor: 'var(--warn)' } as const

export default function QrCodeGenerator({ initialType = 'url' }: { initialType?: QrType }) {
  const [type, setType] = useState<QrType>(initialType)
  const [values, setValues] = useState<Partial<Record<QrType, Record<string, string>>>>(DEFAULTS)
  const [style, setStyle] = useState<QrStyle>(PRESETS[0].style)
  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const [ecChoice, setEcChoice] = useState<Ec>('M')
  const [logoName, setLogoName] = useState('')
  const [logoError, setLogoError] = useState('')
  const [pngSize, setPngSize] = useState('1024')
  const [matrix, setMatrix] = useState<QrMatrix | null>(null)
  const [genError, setGenError] = useState('')
  const [busy, setBusy] = useState(false)

  const fields = values[type] ?? {}
  const touched = FIELDS[type].some((f) => f.kind !== 'security' && f.kind !== 'hidden' && (fields[f.key] ?? '').trim())
  const payload = useMemo(() => (touched ? buildPayload(type, fields) : null), [type, fields, touched])
  const { warnings, ec } = useMemo(() => scanWarnings(style, ecChoice), [style, ecChoice])
  const text = payload?.ok ? payload.text : ''

  // Build the module matrix (debounced; the QR library is loaded on first use).
  useEffect(() => {
    if (!text) {
      setMatrix(null)
      setGenError('')
      return
    }
    let cancelled = false
    const t = setTimeout(() => {
      makeMatrix(text, ec).then(
        (m) => {
          if (cancelled) return
          setMatrix(m)
          setGenError('')
        },
        () => {
          if (cancelled) return
          setMatrix(null)
          setGenError('Too much content for one QR code at this error-correction level. Shorten it or choose a lower level.')
        },
      )
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [text, ec])

  const svg = useMemo(() => (matrix && text ? renderSvg(matrix, style) : ''), [matrix, style, text])

  function setField(key: string, v: string) {
    setValues((prev) => ({ ...prev, [type]: { ...(prev[type] ?? {}), [key]: v } }))
  }
  function patch(p: Partial<QrStyle>) {
    setStyle((s) => ({ ...s, ...p }))
    setPresetId('')
  }
  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id)
    if (!p) return
    setStyle((s) => ({ ...p.style, logo: s.logo }))
    setPresetId(id)
  }

  function onLogo(files: File[]) {
    const f = files[0]
    if (!f) return
    setLogoError('')
    if (!f.type.startsWith('image/')) return setLogoError('Choose an image file (PNG, JPEG, SVG or WebP).')
    if (f.size > MAX_LOGO) return setLogoError('Logo is over 2 MB. Use a smaller image.')
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      const dataUrl = reader.result
      setLogoName(f.name)
      setStyle((s) => ({ ...s, logo: { dataUrl, scale: 0.22, clear: true } }))
    }
    reader.onerror = () => setLogoError('Could not read that image.')
    reader.readAsDataURL(f)
  }
  function removeLogo() {
    setLogoName('')
    setStyle((s) => ({ ...s, logo: undefined }))
  }

  async function exportRaster(mime: 'image/png' | 'image/jpeg') {
    if (!svg) return
    setBusy(true)
    try {
      const blob = await svgToBlob(svg, Number(pngSize), mime)
      downloadBlob(blob, mime === 'image/png' ? 'qr-code.png' : 'qr-code.jpg', mime)
    } catch {
      setGenError('Could not create the image in this browser. Try the SVG download instead.')
    } finally {
      setBusy(false)
    }
  }

  const gradient = style.fill.kind !== 'solid'
  const fromColor = style.fill.kind === 'solid' ? style.fill.color : style.fill.from
  const toColor = style.fill.kind === 'solid' ? '#0f7a4a' : style.fill.to

  return (
    <>
      <Toolbar>
        <Field label="Content">
          <Select value={type} onChange={(v) => setType(v as QrType)} options={TYPES} />
        </Field>
      </Toolbar>

      <div style={{ ...row, marginBottom: 16 }}>
        {FIELDS[type].map((f) => {
          const v = fields[f.key] ?? ''
          if (f.kind === 'security') {
            return (
              <Field key={f.key} label={f.label}>
                <Select
                  value={v || 'WPA'}
                  onChange={(x) => setField(f.key, x)}
                  options={[
                    { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
                    { value: 'WEP', label: 'WEP' },
                    { value: 'nopass', label: 'No password' },
                  ]}
                />
              </Field>
            )
          }
          if (f.kind === 'hidden') {
            return <Toggle key={f.key} label={f.label} checked={v === 'true'} onChange={(c) => setField(f.key, c ? 'true' : 'false')} />
          }
          if (f.key === 'password' && fields.security === 'nopass') return null
          return (
            <div key={f.key} style={{ flex: f.kind === 'textarea' ? '1 1 100%' : '1 1 220px', minWidth: 0 }}>
              <Field label={f.label}>
                {f.kind === 'textarea' ? (
                  <TextArea value={v} onChange={(x) => setField(f.key, x)} placeholder={f.placeholder} rows={3} mono={false} />
                ) : f.kind === 'datetime' ? (
                  <input className="inp" type="datetime-local" value={v} onChange={(e) => setField(f.key, e.target.value)} />
                ) : (
                  <TextInput value={v} onChange={(x) => setField(f.key, x)} placeholder={f.placeholder} />
                )}
              </Field>
              {f.hint && <span className="field-hint">{f.hint}</span>}
            </div>
          )
        })}
      </div>

      {payload && !payload.ok && <Notice kind="error">{payload.error}</Notice>}
      {genError && <Notice kind="error">{genError}</Notice>}

      <IO>
        <Panel title="Design">
          <div style={{ display: 'grid', gap: 16 }}>
            <Group label="Presets">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PRESETS.map((p) => {
                  const c = p.style.fill.kind === 'solid' ? p.style.fill.color : p.style.fill.from
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`btn btn-${presetId === p.id ? 'primary' : 'ghost'} btn-sm`}
                      aria-pressed={presetId === p.id}
                      onClick={() => applyPreset(p.id)}
                    >
                      <span aria-hidden style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: c, marginRight: 6, border: '1px solid var(--line)' }} />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </Group>

            <div style={row}>
              <Field label="Module shape">
                <Select value={style.module} onChange={(v) => patch({ module: v as ModuleShape })} options={MODULES} />
              </Field>
            </div>
            <Group label="Eye frame">
              <Segmented value={style.eyeFrame} onChange={(v) => patch({ eyeFrame: v as EyeFrame })} options={FRAMES} />
            </Group>
            <Group label="Eye centre">
              <Segmented value={style.eyeBall} onChange={(v) => patch({ eyeBall: v as EyeBall })} options={BALLS} />
            </Group>

            <div style={row}>
              <ColorInput
                label="Code colour"
                value={fromColor}
                onChange={(c) => patch({ fill: gradient ? { ...(style.fill as { kind: 'linear' | 'radial'; from: string; to: string }), from: c } : { kind: 'solid', color: c } })}
              />
              {gradient && (
                <>
                  <ColorInput label="Second colour" value={toColor} onChange={(c) => patch({ fill: { ...(style.fill as { kind: 'linear' | 'radial'; from: string; to: string }), to: c } })} />
                  <Field label="Gradient type">
                    <Select
                      value={style.fill.kind}
                      onChange={(k) => patch({ fill: { kind: k as 'linear' | 'radial', from: fromColor, to: toColor, angle: 45 } })}
                      options={[
                        { value: 'linear', label: 'Linear' },
                        { value: 'radial', label: 'Radial' },
                      ]}
                    />
                  </Field>
                </>
              )}
              <ColorInput label="Eye colour" value={style.eyeColor} onChange={(c) => patch({ eyeColor: c })} />
              {style.background !== 'transparent' && (
                <ColorInput label="Background colour" value={style.background} onChange={(c) => patch({ background: c })} />
              )}
            </div>
            <div style={row}>
              <Toggle
                label="Gradient"
                checked={gradient}
                onChange={(on) => patch({ fill: on ? { kind: 'linear', from: fromColor, to: toColor, angle: 45 } : { kind: 'solid', color: fromColor } })}
              />
              <Toggle
                label="Transparent background"
                checked={style.background === 'transparent'}
                onChange={(on) => patch({ background: on ? 'transparent' : '#ffffff' })}
              />
            </div>

            <Group label="Logo">
              {style.logo ? (
                <>
                  <FilePreview name={logoName || 'logo'} thumbUrl={style.logo.dataUrl} onRemove={removeLogo} />
                  <Field label={`Logo size: ${Math.round(style.logo.scale * 100)}%`}>
                    <input
                      type="range"
                      min={10}
                      max={25}
                      value={Math.round(style.logo.scale * 100)}
                      onChange={(e) => {
                        const scale = Number(e.target.value) / 100
                        setStyle((s) => (s.logo ? { ...s, logo: { ...s.logo, scale } } : s))
                      }}
                      style={{ accentColor: 'var(--accent)', width: 200 }}
                    />
                  </Field>
                  <Toggle
                    label="Clear the code behind the logo"
                    checked={style.logo.clear}
                    onChange={(clear) => setStyle((s) => (s.logo ? { ...s, logo: { ...s.logo, clear } } : s))}
                  />
                </>
              ) : (
                <FileDrop onFiles={onLogo} accept="image/*" label="Drop a logo, or click to choose" hint="PNG, JPEG, SVG or WebP — read on your device" />
              )}
              {logoError && <Notice kind="error">{logoError}</Notice>}
            </Group>

            <div style={row}>
              <Field label="Frame">
                <Select
                  value={style.frame}
                  onChange={(v) => patch({ frame: v as QrStyle['frame'], cta: style.cta || 'Scan me' })}
                  options={[
                    { value: 'none', label: 'No frame' },
                    { value: 'box', label: 'Box with text' },
                    { value: 'badge', label: 'Badge with text' },
                  ]}
                />
              </Field>
              {style.frame !== 'none' && (
                <Field label="Frame text">
                  <TextInput value={style.cta} onChange={(v) => patch({ cta: v.slice(0, 40) })} placeholder="Scan me" />
                </Field>
              )}
            </div>
            <div style={row}>
              <Field label={`Quiet zone: ${style.quiet} modules`}>
                <input
                  type="range"
                  min={0}
                  max={8}
                  value={style.quiet}
                  onChange={(e) => patch({ quiet: Number(e.target.value) })}
                  style={{ accentColor: 'var(--accent)', width: 160 }}
                />
              </Field>
              <div>
                <Field label="Error correction">
                  <Select value={ecChoice} onChange={(v) => setEcChoice(v as Ec)} options={EC_OPTIONS} />
                </Field>
                {ec !== ecChoice && <span className="field-hint">Using {ec} because of the logo</span>}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Preview">
          <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
            {svg ? (
              <div
                role="img"
                aria-label="QR code preview"
                style={{ width: '100%', maxWidth: 320, lineHeight: 0, border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface-soft)' }}
                // markup comes from our own renderer: colours are validated and all text is XML-escaped
                dangerouslySetInnerHTML={{ __html: svg.replace('<svg ', '<svg width="100%" ') }}
              />
            ) : (
              <p className="hint-inline" style={{ margin: '24px 0', textAlign: 'center' }}>
                Fill in the content above to see your QR code.
              </p>
            )}
            {warnings.map((w) => (
              <div key={w.kind} className="notice" role="status" style={warnBox}>
                {w.message}
              </div>
            ))}
            <div style={{ ...row, justifyContent: 'center' }}>
              <Field label="PNG / JPEG size">
                <Select value={pngSize} onChange={setPngSize} options={PNG_SIZES} />
              </Field>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <Button variant="primary" onClick={() => exportRaster('image/png')} disabled={!svg || busy}>
                Download PNG
              </Button>
              <Button onClick={() => exportRaster('image/jpeg')} disabled={!svg || busy}>
                Download JPEG
              </Button>
              <Button onClick={() => svg && downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'qr-code.svg')} disabled={!svg}>
                Download SVG
              </Button>
              <CopyButton text={svg} label="Copy SVG" />
            </div>
          </div>
        </Panel>
      </IO>

      <p className="hint-inline" style={{ marginTop: 16 }}>
        Free, no sign-up, no watermark. Static QR code — it never expires and scanning it never goes through our servers.
      </p>
    </>
  )
}
