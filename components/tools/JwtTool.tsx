'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Segmented,
  Toolbar,
  IO,
  Panel,
  Field,
  TextArea,
  TextInput,
  Select,
  CopyButton,
  Notice,
} from '@/components/ui/kit'

/* ---- base64url helpers (pure JS) ----------------------------------- */

function base64UrlDecodeToBytes(input: string): Uint8Array {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function base64UrlDecodeToString(input: string): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(base64UrlDecodeToBytes(input))
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function stringToBase64Url(s: string): string {
  return bytesToBase64Url(new TextEncoder().encode(s))
}

const ALG_OPTIONS = [
  { value: 'HS256', label: 'HS256' },
  { value: 'HS384', label: 'HS384' },
  { value: 'HS512', label: 'HS512' },
]

function hashForAlg(alg: string): 'SHA-256' | 'SHA-384' | 'SHA-512' {
  if (alg === 'HS384') return 'SHA-384'
  if (alg === 'HS512') return 'SHA-512'
  return 'SHA-256'
}

async function hmacSign(secret: string, data: string, alg: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: hashForAlg(alg) },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return bytesToBase64Url(new Uint8Array(sig))
}

/* ---- exp/iat/nbf humanizing ---------------------------------------- */

const TIME_CLAIMS = ['exp', 'iat', 'nbf'] as const

function humanizeClaims(payload: unknown): { lines: string[]; expired: boolean } {
  const lines: string[] = []
  let expired = false
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    const nowSec = Math.floor(Date.now() / 1000)
    for (const claim of TIME_CLAIMS) {
      const v = obj[claim]
      if (typeof v === 'number' && isFinite(v)) {
        const d = new Date(v * 1000)
        const iso = isNaN(d.getTime()) ? '(invalid)' : d.toISOString()
        let note = ''
        if (claim === 'exp') {
          if (v < nowSec) {
            expired = true
            note = ' — EXPIRED'
          } else {
            note = ' — valid'
          }
        }
        if (claim === 'nbf' && v > nowSec) note = ' — not yet active'
        lines.push(`${claim}: ${v}  →  ${iso}${note}`)
      }
    }
  }
  return { lines, expired }
}

export default function JwtTool() {
  const [mode, setMode] = useState('decode')
  const subtle = typeof crypto !== 'undefined' && !!crypto.subtle

  /* decode state */
  const [token, setToken] = useState('')

  /* verify state */
  const [verifyToken, setVerifyToken] = useState('')
  const [verifySecret, setVerifySecret] = useState('')
  const [verifyAlg, setVerifyAlg] = useState('HS256')
  const [verifyResult, setVerifyResult] = useState<{ kind: 'success' | 'error'; msg: string } | null>(
    null,
  )

  /* sign state */
  const [signHeader, setSignHeader] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
  const [signPayload, setSignPayload] = useState(
    '{\n  "sub": "1234567890",\n  "name": "Jane Doe",\n  "iat": 1516239022\n}',
  )
  const [signSecret, setSignSecret] = useState('')
  const [signAlg, setSignAlg] = useState('HS256')
  const [signToken, setSignToken] = useState('')
  const [signError, setSignError] = useState('')

  /* ---- decode (live) ---- */
  const decoded = useMemo(() => {
    if (!token.trim()) {
      return { header: '', payload: '', claims: [] as string[], expired: false, error: '' }
    }
    const parts = token.trim().split('.')
    if (parts.length < 2) {
      return {
        header: '',
        payload: '',
        claims: [],
        expired: false,
        error: 'A JWT needs at least two dot-separated segments (header.payload).',
      }
    }
    try {
      const headerRaw = base64UrlDecodeToString(parts[0])
      const payloadRaw = base64UrlDecodeToString(parts[1])
      const headerObj = JSON.parse(headerRaw)
      const payloadObj = JSON.parse(payloadRaw)
      const { lines, expired } = humanizeClaims(payloadObj)
      return {
        header: JSON.stringify(headerObj, null, 2),
        payload: JSON.stringify(payloadObj, null, 2),
        claims: lines,
        expired,
        error: '',
      }
    } catch {
      return {
        header: '',
        payload: '',
        claims: [],
        expired: false,
        error: 'Could not decode segments as base64url JSON. Is this a valid JWT?',
      }
    }
  }, [token])

  /* ---- verify ---- */
  useEffect(() => {
    let cancelled = false
    async function run() {
      setVerifyResult(null)
      if (!subtle) return
      if (!verifyToken.trim() || !verifySecret) return
      const parts = verifyToken.trim().split('.')
      if (parts.length !== 3) {
        if (!cancelled)
          setVerifyResult({ kind: 'error', msg: 'Token must have three segments to verify.' })
        return
      }
      try {
        const expected = await hmacSign(verifySecret, `${parts[0]}.${parts[1]}`, verifyAlg)
        const ok = expected === parts[2]
        if (!cancelled) {
          setVerifyResult(
            ok
              ? { kind: 'success', msg: `Signature valid (${verifyAlg}).` }
              : {
                  kind: 'error',
                  msg: 'Signature does NOT match. Check the secret and the selected algorithm.',
                },
          )
        }
      } catch {
        if (!cancelled)
          setVerifyResult({ kind: 'error', msg: 'Verification failed while computing the HMAC.' })
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [verifyToken, verifySecret, verifyAlg, subtle])

  /* ---- sign ---- */
  async function doSign() {
    setSignToken('')
    setSignError('')
    if (!subtle) return
    try {
      const headerObj = JSON.parse(signHeader)
      const payloadObj = JSON.parse(signPayload)
      // keep header in sync with the chosen alg
      headerObj.alg = signAlg
      if (!headerObj.typ) headerObj.typ = 'JWT'
      const headerB64 = stringToBase64Url(JSON.stringify(headerObj))
      const payloadB64 = stringToBase64Url(JSON.stringify(payloadObj))
      const signingInput = `${headerB64}.${payloadB64}`
      const sig = await hmacSign(signSecret, signingInput, signAlg)
      setSignToken(`${signingInput}.${sig}`)
    } catch (e) {
      setSignError(
        e instanceof SyntaxError
          ? 'Header or payload is not valid JSON.'
          : 'Could not sign the token. Check inputs and try again.',
      )
    }
  }

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'decode', label: 'Decode' },
            { value: 'verify', label: 'Verify' },
            { value: 'sign', label: 'Sign' },
          ]}
        />
        <span className="hint-inline">HMAC only · on-device</span>
      </Toolbar>

      {mode === 'decode' && (
        <>
          <Field label="JWT" hint="Decoding does not verify the signature.">
            <TextArea
              value={token}
              onChange={setToken}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.signature"
              rows={4}
            />
          </Field>

          {decoded.error ? (
            <Notice kind="error">{decoded.error}</Notice>
          ) : !token.trim() ? (
            <Notice kind="info">Paste a token to decode its header and payload.</Notice>
          ) : (
            <>
              {decoded.expired && (
                <Notice kind="error">This token is expired (exp is in the past).</Notice>
              )}
              <IO>
                <Panel title="header" actions={<CopyButton text={decoded.header} />}>
                  <TextArea value={decoded.header} readOnly rows={10} />
                </Panel>
                <Panel title="payload" actions={<CopyButton text={decoded.payload} />}>
                  <TextArea value={decoded.payload} readOnly rows={10} />
                </Panel>
              </IO>
              {decoded.claims.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="hint-inline" style={{ marginBottom: 8 }}>
                    time claims
                  </div>
                  <div
                    style={{
                      border: '1px solid var(--line-strong)',
                      borderRadius: 4,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {decoded.claims.map((c, i) => (
                      <code
                        key={i}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          color: c.includes('EXPIRED') ? '#ff6b6b' : 'var(--bone)',
                        }}
                      >
                        {c}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {mode === 'verify' && (
        <>
          {!subtle && (
            <Notice kind="info">
              Verifying signatures needs Web Crypto, which requires a secure context (HTTPS or
              localhost). Use the Decode tab to inspect token contents anywhere.
            </Notice>
          )}
          <Field label="JWT">
            <TextArea
              value={verifyToken}
              onChange={setVerifyToken}
              placeholder="header.payload.signature"
              rows={4}
            />
          </Field>
          <Toolbar>
            <Field label="Algorithm">
              <Select value={verifyAlg} onChange={setVerifyAlg} options={ALG_OPTIONS} />
            </Field>
          </Toolbar>
          <Field label="Secret">
            <TextInput
              value={verifySecret}
              onChange={setVerifySecret}
              type="password"
              placeholder="HMAC shared secret"
            />
          </Field>
          {subtle && verifyResult && (
            <Notice kind={verifyResult.kind}>{verifyResult.msg}</Notice>
          )}
          {subtle && !verifyResult && (verifyToken.trim() && verifySecret) && (
            <Notice kind="info">Computing…</Notice>
          )}
        </>
      )}

      {mode === 'sign' && (
        <>
          {!subtle && (
            <Notice kind="info">
              Signing needs Web Crypto, which requires a secure context (HTTPS or localhost).
            </Notice>
          )}
          <IO>
            <Panel title="header (JSON)">
              <TextArea value={signHeader} onChange={setSignHeader} rows={6} />
            </Panel>
            <Panel title="payload (JSON)">
              <TextArea value={signPayload} onChange={setSignPayload} rows={6} />
            </Panel>
          </IO>
          <Toolbar>
            <Field label="Algorithm">
              <Select value={signAlg} onChange={setSignAlg} options={ALG_OPTIONS} />
            </Field>
            <button
              className="btn btn-primary"
              onClick={doSign}
              disabled={!subtle}
              type="button"
            >
              Sign token
            </button>
          </Toolbar>
          <Field label="Secret">
            <TextInput
              value={signSecret}
              onChange={setSignSecret}
              type="password"
              placeholder="HMAC shared secret"
            />
          </Field>
          {signError && <Notice kind="error">{signError}</Notice>}
          {signToken && (
            <Panel title="signed token" actions={<CopyButton text={signToken} />}>
              <TextArea value={signToken} readOnly rows={4} />
            </Panel>
          )}
        </>
      )}
    </>
  )
}
