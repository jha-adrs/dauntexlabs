// Sandboxed-iframe HTML shared by the EML viewer and the file viewer's HTML preview.

/** CSP for previewed HTML: nothing may load except inline styles and data: images. */
export const SANDBOX_CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'"

/**
 * HTML for the sandboxed iframe's srcdoc. The meta CSP comes first so it is in force
 * before any of the email's markup; it is the real guard. Stripping script, meta refresh,
 * base and link tags is defence in depth. `<base target="_blank">` turns link clicks into
 * popups, which the sandbox (no allow-popups) blocks, so the frame never navigates away.
 */
export function safeSrcdoc(html: string): string {
  let out = html
  let prev: string
  do {
    prev = out
    out = out
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<\/?script\b[^>]*>?/gi, '')
      .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?\s*refresh[^>]*>?/gi, '')
      .replace(/<base\b[^>]*>?/gi, '')
      .replace(/<link\b[^>]*>?/gi, '')
  } while (out !== prev)
  return `<meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}"><base target="_blank">${out}`
}
