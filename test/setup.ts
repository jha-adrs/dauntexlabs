import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { webcrypto } from 'node:crypto'

// --- Web Crypto (SHA / HMAC / AES / JWT sign-verify / UUID / random) --------
// jsdom ships no SubtleCrypto; provide Node's so crypto tools run as in HTTPS.
if (!(globalThis.crypto && globalThis.crypto.subtle)) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  })
}
// Tools gate Web Crypto on a secure context; tests run "as if" secure.
Object.defineProperty(globalThis, 'isSecureContext', { value: true, configurable: true })

// --- Object URLs ------------------------------------------------------------
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock'
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {}
}

// --- Canvas (image / favicon / QR-PNG tools) --------------------------------
// jsdom has no canvas rendering. Provide a stub 2D context + toBlob so image
// tools run end-to-end. NOTE: pixels are NOT real — assert flow, not encoding.
const ctxStub = new Proxy(
  {
    canvas: null,
    fillStyle: '#000',
    strokeStyle: '#000',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  },
  {
    get(target: Record<string, unknown>, prop: string) {
      if (prop in target) return target[prop]
      // every drawing method is a no-op
      return () => undefined
    },
    set(target: Record<string, unknown>, prop: string, value: unknown) {
      target[prop] = value
      return true
    },
  },
)
HTMLCanvasElement.prototype.getContext = function () {
  return ctxStub as unknown as CanvasRenderingContext2D
} as typeof HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.toBlob = function (
  cb: BlobCallback,
  type?: string,
) {
  // a tiny non-empty blob standing in for the encoded image
  cb(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: type || 'image/png' }))
}
HTMLCanvasElement.prototype.toDataURL = function (type?: string) {
  return `data:${type || 'image/png'};base64,iVBORw0KGgo=`
}

// --- Image (decodes instantly with a fake intrinsic size) -------------------
class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  naturalWidth = 120
  naturalHeight = 90
  width = 120
  height = 90
  decoding = 'auto'
  crossOrigin: string | null = null
  private _src = ''
  set src(v: string) {
    this._src = v
    setTimeout(() => this.onload?.(), 0)
  }
  get src() {
    return this._src
  }
}
;(globalThis as unknown as { Image: typeof MockImage }).Image = MockImage

// --- cleanup React trees between tests --------------------------------------
afterEach(() => cleanup())
