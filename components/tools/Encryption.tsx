'use client'

import { useState } from 'react'
import {
  Select,
  Segmented,
  Toolbar,
  Field,
  TextArea,
  TextInput,
  Button,
  CopyButton,
  Notice,
} from '@/components/ui/kit'
import Pgp from './Pgp'

type Algo = 'aes' | 'hmac' | 'sha256' | 'rot13' | 'caesar' | 'rsa' | 'pgp'

const ALGOS: { value: Algo; label: string }[] = [
  { value: 'aes', label: 'AES-256-GCM (passphrase)' },
  { value: 'hmac', label: 'HMAC-SHA256' },
  { value: 'sha256', label: 'SHA-256' },
  { value: 'rot13', label: 'ROT13' },
  { value: 'caesar', label: 'Caesar cipher' },
  { value: 'rsa', label: 'RSA-OAEP (Web Crypto)' },
  { value: 'pgp', label: 'PGP (OpenPGP)' },
]

/* ---- byte / base64 helpers ----------------------------------------- */

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.trim())
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/* ---- pure JS ciphers ----------------------------------------------- */

function rot13(text: string): string {
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

function caesar(text: string, shift: number): string {
  const s = ((shift % 26) + 26) % 26
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base)
  })
}

/* ---- AES-256-GCM with PBKDF2 --------------------------------------- */

async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function aesEncrypt(passphrase: string, plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveAesKey(passphrase, salt)
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plaintext),
    ),
  )
  const combined = new Uint8Array(salt.length + iv.length + ct.length)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(ct, salt.length + iv.length)
  return bytesToBase64(combined)
}

async function aesDecrypt(passphrase: string, payload: string): Promise<string> {
  const combined = base64ToBytes(payload)
  if (combined.length < 16 + 12 + 1) throw new Error('Ciphertext too short.')
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const ct = combined.slice(28)
  const key = await deriveAesKey(passphrase, salt)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct as BufferSource)
  return new TextDecoder().decode(pt)
}

/* ---- HMAC / SHA ---------------------------------------------------- */

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return toHex(new Uint8Array(sig))
}

async function sha256Hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message))
  return toHex(new Uint8Array(buf))
}

/* ---- RSA-OAEP (Web Crypto) ----------------------------------------- */

function pemToBytes(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  return base64ToBytes(b64)
}

function bytesToPem(bytes: Uint8Array, label: string): string {
  const b64 = bytesToBase64(bytes)
  const lines = b64.match(/.{1,64}/g) ?? []
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`
}

async function rsaGenerateKeypair(): Promise<{ publicPem: string; privatePem: string }> {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt'],
  )
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey))
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey))
  return {
    publicPem: bytesToPem(spki, 'PUBLIC KEY'),
    privatePem: bytesToPem(pkcs8, 'PRIVATE KEY'),
  }
}

async function rsaEncrypt(publicPem: string, plaintext: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'spki',
    pemToBytes(publicPem) as BufferSource,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(plaintext)),
  )
  return bytesToBase64(ct)
}

async function rsaDecrypt(privatePem: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(privatePem) as BufferSource,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  )
  const pt = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, base64ToBytes(payload) as BufferSource)
  return new TextDecoder().decode(pt)
}

export default function Encryption() {
  const subtle = typeof crypto !== 'undefined' && !!crypto.subtle

  const [algo, setAlgo] = useState<Algo>('aes')
  const [op, setOp] = useState('encrypt') // encrypt | decrypt
  const [message, setMessage] = useState('')
  const [secret, setSecret] = useState('')
  const [shift, setShift] = useState('3')
  const [rsaKey, setRsaKey] = useState('') // public PEM to encrypt, private PEM to decrypt
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const needsSubtle = algo === 'aes' || algo === 'hmac' || algo === 'sha256' || algo === 'rsa'
  const hasOps = algo === 'aes' || algo === 'rot13' || algo === 'caesar' || algo === 'rsa'

  async function run() {
    setError('')
    setOutput('')
    if (!message.trim() && algo !== 'rsa') {
      setError('Enter a message first.')
      return
    }
    try {
      setBusy(true)
      switch (algo) {
        case 'rot13':
          // ROT13 is its own inverse, so encrypt/decrypt are identical.
          setOutput(rot13(message))
          break
        case 'caesar': {
          const n = parseInt(shift, 10)
          if (!Number.isFinite(n) || n < 1 || n > 25) {
            setError('Shift must be a whole number between 1 and 25.')
            break
          }
          setOutput(op === 'encrypt' ? caesar(message, n) : caesar(message, -n))
          break
        }
        case 'sha256':
          setOutput(await sha256Hex(message))
          break
        case 'hmac':
          if (!secret) {
            setError('HMAC needs a key.')
            break
          }
          setOutput(await hmacSha256Hex(secret, message))
          break
        case 'aes':
          if (!secret) {
            setError('AES needs a passphrase.')
            break
          }
          setOutput(
            op === 'encrypt'
              ? await aesEncrypt(secret, message)
              : await aesDecrypt(secret, message),
          )
          break
        case 'rsa':
          if (!rsaKey.trim()) {
            setError(
              op === 'encrypt'
                ? 'Paste a PEM public key (or generate a keypair below).'
                : 'Paste a PEM private key to decrypt.',
            )
            break
          }
          if (!message.trim()) {
            setError('Enter a message first.')
            break
          }
          setOutput(
            op === 'encrypt'
              ? await rsaEncrypt(rsaKey, message)
              : await rsaDecrypt(rsaKey, message),
          )
          break
      }
    } catch (e) {
      setError(
        op === 'decrypt'
          ? 'Decryption failed. Wrong passphrase/key, or the input is not valid ciphertext.'
          : e instanceof Error
            ? e.message
            : 'Operation failed.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function generateRsa() {
    setError('')
    try {
      setBusy(true)
      const { publicPem, privatePem } = await rsaGenerateKeypair()
      // Show both in the output area; load the relevant one into the key field.
      setRsaKey(op === 'encrypt' ? publicPem : privatePem)
      setOutput(`${publicPem}\n\n${privatePem}`)
    } catch {
      setError('Could not generate an RSA keypair.')
    } finally {
      setBusy(false)
    }
  }

  const blocked = needsSubtle && !subtle

  return (
    <>
      <Toolbar>
        <Field label="Algorithm">
          <Select value={algo} onChange={(v) => { setAlgo(v as Algo); setOutput(''); setError('') }} options={ALGOS} />
        </Field>
        {hasOps && (
          <Segmented
            value={op}
            onChange={setOp}
            options={[
              { value: 'encrypt', label: 'Encrypt' },
              { value: 'decrypt', label: 'Decrypt' },
            ]}
          />
        )}
        {algo === 'caesar' && (
          <Field label="Shift (1–25)">
            <TextInput value={shift} onChange={setShift} type="number" />
          </Field>
        )}
        {algo === 'rsa' && (
          <span className="hint-inline">
            Raw RSA-OAEP via Web Crypto — for real PGP messages choose “PGP (OpenPGP)”.
          </span>
        )}
        {algo === 'pgp' && (
          <span className="hint-inline">
            Full PGP via the bundled OpenPGP.js library — runs entirely in your browser.
          </span>
        )}
      </Toolbar>

      {algo === 'pgp' ? (
        <Pgp />
      ) : (
        <>
      {blocked && (
        <Notice kind="info">
          {algo === 'sha256' || algo === 'hmac' ? 'This digest' : 'This cipher'} needs Web Crypto,
          which requires a secure context (HTTPS or localhost). ROT13 and Caesar work everywhere.
        </Notice>
      )}

      <Field
        label={op === 'decrypt' && (algo === 'aes' || algo === 'rsa') ? 'Ciphertext (base64)' : 'Message'}
      >
        <TextArea
          value={message}
          onChange={setMessage}
          placeholder={
            op === 'decrypt' && (algo === 'aes' || algo === 'rsa')
              ? 'Paste base64 ciphertext…'
              : 'Text to process…'
          }
          rows={7}
        />
      </Field>

      {(algo === 'aes' || algo === 'hmac') && (
        <Field
          label={algo === 'aes' ? 'Passphrase' : 'HMAC key'}
          hint={
            algo === 'aes'
              ? 'Key derived with PBKDF2-SHA256, 100k iterations, random 16-byte salt.'
              : undefined
          }
        >
          <TextInput
            value={secret}
            onChange={setSecret}
            type="password"
            placeholder={algo === 'aes' ? 'passphrase' : 'secret key'}
          />
        </Field>
      )}

      {algo === 'rsa' && (
        <Field
          label={op === 'encrypt' ? 'Public key (PEM)' : 'Private key (PEM)'}
          hint="RSA-OAEP (SHA-256), 2048-bit. Max plaintext ≈ 190 bytes."
        >
          <TextArea
            value={rsaKey}
            onChange={setRsaKey}
            placeholder={`-----BEGIN ${op === 'encrypt' ? 'PUBLIC' : 'PRIVATE'} KEY-----\n…`}
            rows={5}
          />
        </Field>
      )}

      <Toolbar>
        <Button variant="primary" onClick={run} disabled={busy || blocked}>
          {busy ? 'Working…' : 'Run'}
        </Button>
        {algo === 'rsa' && (
          <Button onClick={generateRsa} disabled={busy || blocked}>
            Generate keypair
          </Button>
        )}
      </Toolbar>

      {error && <Notice kind="error">{error}</Notice>}

      <Field label="Output">
        <TextArea value={output} readOnly placeholder="Result appears here…" rows={7} />
      </Field>
      {output && (
        <Toolbar>
          <CopyButton text={output} />
        </Toolbar>
      )}
        </>
      )}
    </>
  )
}
