import type { ToolContent } from './types'

export default {
  intro: [
    'A HAR file is a recording of everything your browser sent and received on a page: every URL, header, cookie and body. Support teams often ask for one to debug a problem, but the same file usually holds your session cookies, bearer tokens, API keys and sometimes passwords, which is enough for someone to sign in as you. This HAR sanitizer finds those values and removes them before you share the file.',
    'It looks in request and response headers (Cookie, Set-Cookie, Authorization, X-Api-Key and any header named like a token or key), cookie lists, URL query strings and fragments, form fields, JSON request and response bodies, and it replaces JWTs wherever they appear. You see a list of what was found, grouped by type, with each value masked so the list itself is safe to look at. Each group has its own switch, and you can also drop request and response bodies entirely.',
    'The file is read in your browser and processed on your device, so the secrets in it are not sent to us to be cleaned. The result is still a valid HAR file that opens in Chrome, Firefox and HAR viewers.',
  ],
  steps: [
    'Export a HAR from your browser: open developer tools, go to the Network panel and choose Save all as HAR (or Export HAR).',
    'Drop the .har file onto the box, or paste its contents into the text box below.',
    'Review what was found. Values are masked, showing only the first few characters and the length.',
    'Switch off any group you want to keep, or switch on "Drop request and response bodies" if the bodies are not needed.',
    'Click Download sanitized HAR and check the new file before sending it.',
  ],
  faq: [
    {
      q: 'Is it safe to share a HAR file?',
      a: 'Not as exported. A raw HAR usually contains session cookies and tokens that can be used to act as you until they expire. Sanitize it first, and only share it with people who need it.',
    },
    {
      q: 'What exactly gets redacted?',
      a: 'Cookie values, authorization and API key headers, query and form parameters or JSON keys whose names contain words like token, key, secret, session, code, password, auth or sig, and anything that looks like a JWT. Cookie and parameter names are kept so the file is still useful for debugging; only values are replaced with REDACTED.',
    },
    {
      q: 'What happens to base64-encoded response bodies?',
      a: 'They are decoded, scanned for JWTs and secret JSON keys, and encoded again, so the rest of the bytes stay as they were. If you would rather not keep any bodies, switch on the option to drop them.',
    },
    {
      q: 'Can it miss a secret?',
      a: 'It can. A value stored under an unusual name, or inside a custom format, may not be recognised. Treat the tool as a strong first pass, search the sanitized file for anything you know is sensitive, and drop bodies when in doubt.',
    },
    {
      q: 'Does the redacted file still open in HAR viewers?',
      a: 'Yes. The structure is unchanged and URLs stay valid, so the sanitized file loads in browser developer tools and HAR analyzers like the original.',
    },
  ],
} satisfies ToolContent
