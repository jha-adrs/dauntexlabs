import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This hash generator calculates the MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes of any text you type, all at once. A hash is a fixed-length fingerprint of the input: change a single character and the hash changes completely, which makes hashes useful for comparing values, checking integrity and debugging code that signs or stores data.',
    'The SHA hashes are computed with your browser\'s built-in Web Crypto API and MD5 with a small bundled implementation, so the text is processed on your device rather than sent off to be hashed.',
  ],
  steps: [
    'Type or paste the text you want to hash into the Input box.',
    'Read the MD5, SHA-1, SHA-256, SHA-384 and SHA-512 results that appear below.',
    'Turn on Uppercase if you need the hex output in capital letters.',
    'Click the copy button next to any hash to copy it.',
  ],
  faq: [
    {
      q: 'How do I generate an MD5 or SHA-256 hash of a string?',
      a: 'Type the string into the Input box. Every supported hash is shown at the same time, so the MD5 and SHA-256 values are both ready to copy. The text is encoded as UTF-8 before hashing, which matches what most programming languages do by default.',
    },
    {
      q: 'Why does my hash not match the one from another tool?',
      a: 'Hashes are exact, so any difference in input changes the result. The usual culprits are a trailing newline or space, a different text encoding, or hashing a file rather than its text. Check for invisible whitespace first.',
    },
    {
      q: 'Can I hash a file?',
      a: 'Not with this tool. It hashes text that you type or paste. To verify a download, use a file checksum tool or your operating system\'s built-in command such as sha256sum or certutil.',
    },
    {
      q: 'Can a hash be reversed back to the original text?',
      a: 'No. Hash functions are one-way. Short or common inputs can sometimes be guessed by trying many candidates, which is why passwords should be stored with a slow, salted algorithm such as bcrypt or Argon2 rather than plain MD5 or SHA-256.',
    },
    {
      q: 'Why do I only see MD5?',
      a: 'The SHA family needs Web Crypto, which browsers only enable on secure pages (HTTPS or localhost). On an insecure connection the tool shows a notice and still computes MD5.',
    },
  ],
}

export default content
