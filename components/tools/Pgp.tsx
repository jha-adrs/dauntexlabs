'use client'

// Real PGP via OpenPGP.js. The library is bundled into the app (not loaded from
// any CDN) and is imported dynamically so its ~weighty code only loads when a
// PGP action actually runs. Every operation — key generation, encryption,
// decryption — happens locally; no key, passphrase or message ever leaves the
// browser.

import { useState } from 'react'
import {
  Segmented,
  Field,
  TextArea,
  TextInput,
  Select,
  Button,
  CopyButton,
  DownloadButton,
  Notice,
  IO,
  Panel,
  Toolbar,
} from '@/components/ui/kit'

type Mode = 'encrypt' | 'decrypt' | 'keygen'
type Method = 'password' | 'key'

async function lib() {
  return import('openpgp')
}

export default function Pgp() {
  const [mode, setMode] = useState<Mode>('encrypt')
  const [method, setMethod] = useState<Method>('password')

  const [message, setMessage] = useState('') // plaintext (encrypt) / armored msg (decrypt)
  const [password, setPassword] = useState('')
  const [pubKey, setPubKey] = useState('')
  const [privKey, setPrivKey] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [output, setOutput] = useState('')

  // keygen
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [keyType, setKeyType] = useState('ecc')
  const [kgPass, setKgPass] = useState('')
  const [genPub, setGenPub] = useState('')
  const [genPriv, setGenPriv] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // OpenPGP.js needs the Web Crypto API, which is only available in a secure
  // context (HTTPS or localhost).
  const subtle = typeof crypto !== 'undefined' && !!crypto.subtle

  function switchMode(m: string) {
    setMode(m as Mode)
    setError('')
    setOutput('')
  }

  async function doEncrypt() {
    setError('')
    setOutput('')
    if (!message.trim()) return setError('Enter a message to encrypt.')
    try {
      setBusy(true)
      const openpgp = await lib()
      const msg = await openpgp.createMessage({ text: message })
      let armored: string
      if (method === 'key') {
        if (!pubKey.trim()) return setError('Paste the recipient’s public key.')
        const key = await openpgp.readKey({ armoredKey: pubKey })
        armored = await openpgp.encrypt({ message: msg, encryptionKeys: key })
      } else {
        if (!password) return setError('Enter a password.')
        armored = await openpgp.encrypt({ message: msg, passwords: [password] })
      }
      setOutput(armored)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encryption failed.')
    } finally {
      setBusy(false)
    }
  }

  async function doDecrypt() {
    setError('')
    setOutput('')
    if (!message.trim()) return setError('Paste a PGP message to decrypt.')
    try {
      setBusy(true)
      const openpgp = await lib()
      const msg = await openpgp.readMessage({ armoredMessage: message })
      let data: string
      if (method === 'key') {
        if (!privKey.trim()) return setError('Paste your private key.')
        const raw = await openpgp.readPrivateKey({ armoredKey: privKey })
        const key = passphrase ? await openpgp.decryptKey({ privateKey: raw, passphrase }) : raw
        const res = await openpgp.decrypt({ message: msg, decryptionKeys: key })
        data = res.data as string
      } else {
        if (!password) return setError('Enter the password.')
        const res = await openpgp.decrypt({ message: msg, passwords: [password] })
        data = res.data as string
      }
      setOutput(data)
    } catch {
      setError('Decryption failed — wrong key/password or the message is not valid PGP.')
    } finally {
      setBusy(false)
    }
  }

  async function doKeygen() {
    setError('')
    setGenPub('')
    setGenPriv('')
    if (!name.trim() && !email.trim()) return setError('Enter a name or email for the key.')
    try {
      setBusy(true)
      const openpgp = await lib()
      const userIDs = [{ name: name || undefined, email: email || undefined }]
      const pass = kgPass || undefined
      const result =
        keyType === 'ecc'
          ? await openpgp.generateKey({ type: 'curve25519', userIDs, passphrase: pass, format: 'armored' })
          : await openpgp.generateKey({
              type: 'rsa',
              rsaBits: keyType === 'rsa4096' ? 4096 : 2048,
              userIDs,
              passphrase: pass,
              format: 'armored',
            })
      setGenPub(result.publicKey)
      setGenPriv(result.privateKey)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Key generation failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={switchMode}
          options={[
            { value: 'encrypt', label: 'Encrypt' },
            { value: 'decrypt', label: 'Decrypt' },
            { value: 'keygen', label: 'Generate Keys' },
          ]}
        />
        <span className="hint-inline">OpenPGP.js · keys &amp; data stay in your browser</span>
      </Toolbar>

      {!subtle && (
        <Notice kind="info">
          PGP uses the Web Crypto API, which requires a secure context (HTTPS or localhost). On the
          deployed HTTPS site, key generation and encryption/decryption work normally.
        </Notice>
      )}

      {mode === 'keygen' && (
        <>
          <Toolbar>
            <Field label="Key type">
              <Select
                value={keyType}
                onChange={setKeyType}
                options={[
                  { value: 'ecc', label: 'ECC · Curve25519 (fast)' },
                  { value: 'rsa2048', label: 'RSA 2048' },
                  { value: 'rsa4096', label: 'RSA 4096 (slow)' },
                ]}
              />
            </Field>
            <Field label="Name">
              <TextInput value={name} onChange={setName} placeholder="Ada Lovelace" />
            </Field>
            <Field label="Email">
              <TextInput value={email} onChange={setEmail} placeholder="ada@example.com" />
            </Field>
            <Field label="Passphrase (optional)" hint="Encrypts the private key.">
              <TextInput value={kgPass} onChange={setKgPass} type="password" />
            </Field>
          </Toolbar>
          <Toolbar>
            <Button variant="primary" onClick={doKeygen} disabled={busy || !subtle}>
              {busy ? 'Generating…' : 'Generate keypair'}
            </Button>
          </Toolbar>
          {error && <Notice kind="error">{error}</Notice>}
          {(genPub || genPriv) && (
            <IO>
              <Panel
                title="public key — share this"
                actions={
                  <>
                    <CopyButton text={genPub} />
                    <DownloadButton text={genPub} filename="public.asc" mime="application/pgp-keys" />
                  </>
                }
              >
                <TextArea value={genPub} readOnly rows={12} />
              </Panel>
              <Panel
                title="private key — keep secret"
                actions={
                  <>
                    <CopyButton text={genPriv} />
                    <DownloadButton text={genPriv} filename="private.asc" mime="application/pgp-keys" />
                  </>
                }
              >
                <TextArea value={genPriv} readOnly rows={12} />
              </Panel>
            </IO>
          )}
        </>
      )}

      {mode === 'encrypt' && (
        <>
          <Toolbar>
            <Segmented
              value={method}
              onChange={(v) => setMethod(v as Method)}
              options={[
                { value: 'password', label: 'Password' },
                { value: 'key', label: 'Public key' },
              ]}
            />
          </Toolbar>
          {method === 'key' ? (
            <Field label="Recipient public key (armored)">
              <TextArea value={pubKey} onChange={setPubKey} rows={6} placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----" />
            </Field>
          ) : (
            <Field label="Password" hint="The recipient needs this same password to decrypt.">
              <TextInput value={password} onChange={setPassword} type="password" placeholder="shared password" />
            </Field>
          )}
          <IO>
            <Panel title="message">
              <TextArea value={message} onChange={setMessage} rows={10} placeholder="Plaintext to encrypt…" />
            </Panel>
            <Panel
              title="pgp message"
              actions={
                <>
                  <CopyButton text={output} />
                  <DownloadButton text={output} filename="message.asc" mime="application/pgp-encrypted" />
                </>
              }
            >
              <TextArea value={output} readOnly rows={10} placeholder="-----BEGIN PGP MESSAGE-----" />
            </Panel>
          </IO>
          <Toolbar>
            <Button variant="primary" onClick={doEncrypt} disabled={busy || !subtle}>
              {busy ? 'Encrypting…' : 'Encrypt'}
            </Button>
          </Toolbar>
          {error && <Notice kind="error">{error}</Notice>}
        </>
      )}

      {mode === 'decrypt' && (
        <>
          <Toolbar>
            <Segmented
              value={method}
              onChange={(v) => setMethod(v as Method)}
              options={[
                { value: 'password', label: 'Password' },
                { value: 'key', label: 'Private key' },
              ]}
            />
          </Toolbar>
          {method === 'key' ? (
            <>
              <Field label="Your private key (armored)">
                <TextArea value={privKey} onChange={setPrivKey} rows={6} placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----" />
              </Field>
              <Field label="Key passphrase (if the key is protected)">
                <TextInput value={passphrase} onChange={setPassphrase} type="password" />
              </Field>
            </>
          ) : (
            <Field label="Password">
              <TextInput value={password} onChange={setPassword} type="password" placeholder="password used to encrypt" />
            </Field>
          )}
          <IO>
            <Panel title="pgp message">
              <TextArea value={message} onChange={setMessage} rows={10} placeholder="-----BEGIN PGP MESSAGE-----" />
            </Panel>
            <Panel title="decrypted" actions={<CopyButton text={output} />}>
              <TextArea value={output} readOnly rows={10} placeholder="Plaintext appears here…" />
            </Panel>
          </IO>
          <Toolbar>
            <Button variant="primary" onClick={doDecrypt} disabled={busy || !subtle}>
              {busy ? 'Decrypting…' : 'Decrypt'}
            </Button>
          </Toolbar>
          {error && <Notice kind="error">{error}</Notice>}
        </>
      )}
    </>
  )
}
