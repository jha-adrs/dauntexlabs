import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TextEncoder as NodeTE, TextDecoder as NodeTD } from 'node:util'
import Pgp from '@/components/tools/Pgp'

/* OpenPGP.js runs against Node's webcrypto (provided in setup), so password
 * round-trips and curve25519 keygen work for real. Operations are slow-ish —
 * use generous timeouts.
 *
 * Realm note: jsdom's global TextEncoder().encode() returns a Uint8Array from a
 * foreign realm, which fails OpenPGP.js's internal `Uint8Array.prototype
 * .isPrototypeOf` guard (it throws "concatUint8Array: Data must be in the form
 * of a Uint8Array"). We install a TextEncoder whose output is a *global-realm*
 * Uint8Array — the same realm OpenPGP loaded under — so its encoding path works.
 * This only adjusts a global polyfill in this test file; the component is
 * untouched and behaves identically in a real browser (where there's one realm). */
beforeAll(() => {
  const GUA = (globalThis as unknown as { Uint8Array: Uint8ArrayConstructor }).Uint8Array
  class AlignedTextEncoder {
    readonly encoding = 'utf-8'
    private te = new NodeTE()
    encode(input = ''): Uint8Array {
      const out = this.te.encode(input)
      return new GUA(out.buffer, out.byteOffset, out.byteLength)
    }
    encodeInto(src: string, dest: Uint8Array) {
      return this.te.encodeInto(src, dest)
    }
  }
  ;(globalThis as unknown as { TextEncoder: unknown }).TextEncoder = AlignedTextEncoder
  ;(globalThis as unknown as { TextDecoder: unknown }).TextDecoder = NodeTD
})

function getMode(name: string) {
  return screen.getByRole('tab', { name })
}

describe('Pgp', () => {
  it('Password mode: encrypt then decrypt round-trips to the original text', async () => {
    render(<Pgp />)

    // Default mode is Encrypt, default method is Password.
    const password = screen.getByPlaceholderText('shared password') as HTMLInputElement
    fireEvent.change(password, { target: { value: 'hunter2' } })

    const plain = screen.getByPlaceholderText('Plaintext to encrypt…') as HTMLTextAreaElement
    fireEvent.change(plain, { target: { value: 'meet at noon' } })

    fireEvent.click(screen.getByRole('button', { name: 'Encrypt' }))

    // Output textarea has placeholder "-----BEGIN PGP MESSAGE-----"
    const out = screen.getByPlaceholderText('-----BEGIN PGP MESSAGE-----') as HTMLTextAreaElement
    let armored = ''
    await waitFor(() => {
      armored = out.value
      expect(armored.startsWith('-----BEGIN PGP MESSAGE-----')).toBe(true)
    }, { timeout: 15000 })

    // Switch to Decrypt; password method is preserved.
    fireEvent.click(getMode('Decrypt'))

    // In decrypt mode, the password field placeholder differs.
    const decPassword = screen.getByPlaceholderText('password used to encrypt') as HTMLInputElement
    fireEvent.change(decPassword, { target: { value: 'hunter2' } })

    // The pgp message input in decrypt mode also uses the BEGIN placeholder.
    const msgIn = screen.getByPlaceholderText('-----BEGIN PGP MESSAGE-----') as HTMLTextAreaElement
    fireEvent.change(msgIn, { target: { value: armored } })

    fireEvent.click(screen.getByRole('button', { name: 'Decrypt' }))

    const decryptedOut = screen.getByPlaceholderText('Plaintext appears here…') as HTMLTextAreaElement
    await waitFor(() => expect(decryptedOut.value).toBe('meet at noon'), { timeout: 15000 })
  })

  it('Generate Keys (ECC) with a name produces armored public + private blocks', async () => {
    render(<Pgp />)

    fireEvent.click(getMode('Generate Keys'))

    // Key type defaults to ECC (curve25519). Just provide a name.
    fireEvent.change(screen.getByPlaceholderText('Ada Lovelace'), { target: { value: 'Test User' } })

    fireEvent.click(screen.getByRole('button', { name: 'Generate keypair' }))

    // Two read-only textareas appear with the armored blocks.
    await waitFor(() => {
      const areas = screen
        .getAllByRole('textbox')
        .filter((el): el is HTMLTextAreaElement => el instanceof HTMLTextAreaElement)
      const values = areas.map((a) => a.value)
      expect(values.some((v) => v.startsWith('-----BEGIN PGP PUBLIC KEY BLOCK-----'))).toBe(true)
      expect(values.some((v) => v.startsWith('-----BEGIN PGP PRIVATE KEY BLOCK-----'))).toBe(true)
    }, { timeout: 15000 })
  })
})
