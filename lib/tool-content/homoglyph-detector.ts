import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Some characters from other alphabets look exactly like English letters. A Cyrillic "а" or a Greek "Η" is visually identical to the Latin "a" and "H", which is how lookalike domains such as "pаypal.com" and fake usernames are made. Invisible characters like the zero-width space can also hide inside text and break searches, passwords or code.',
    'This homoglyph detector checks text character by character. It highlights suspicious characters inline, lists each one with its position, Unicode code point, script and the ASCII character it imitates, and produces an ASCII "skeleton" of the text. You can also get a copy with only the invisible characters removed. The check runs in your browser.',
    'The lookalike list is a subset of the Unicode confusables data (Cyrillic, Greek, Armenian, Cherokee, fullwidth and mathematical letters), used under the Unicode License.',
  ],
  steps: [
    'Paste a domain, username, email address or any text into the box.',
    'Look at the highlighted view: marked characters are not the plain ASCII they appear to be.',
    'Check the table for each character\'s position, code point, script and what it looks like.',
    'Copy the ASCII skeleton, or turn on "Remove invisible characters" to copy the text with only hidden characters stripped.',
  ],
  faq: [
    {
      q: 'What is a homoglyph attack?',
      a: 'It is a trick where a character from another script replaces a lookalike Latin letter, so "pаypal.com" with a Cyrillic "а" looks real but points somewhere else. It is used in phishing links, fake accounts and code that hides malicious changes.',
    },
    {
      q: 'How can I tell if a domain uses Cyrillic letters?',
      a: 'Paste it here. Any Cyrillic character that looks like a Latin letter is highlighted and listed with the script "Cyrillic" and the letter it imitates. A browser showing the domain as "xn--…" (punycode) is another sign.',
    },
    {
      q: 'How do I find and remove zero-width spaces?',
      a: 'Invisible characters such as the zero-width space (U+200B), zero-width joiner, byte order mark, soft hyphen and bidirectional control characters are shown as marked code points. Turn on "Remove invisible characters" to get a copy without them.',
    },
    {
      q: 'What is the ASCII skeleton?',
      a: 'It is your text with every detected lookalike replaced by the ASCII character it imitates and invisible characters removed. If the skeleton of two strings is the same, they can look the same to a reader.',
    },
    {
      q: 'Does it catch every lookalike character?',
      a: 'No. It covers the common sources (Cyrillic, Greek, Armenian, Cherokee, fullwidth and mathematical alphanumeric letters) from Unicode\'s confusables list, mapped to plain ASCII. Lookalikes from other scripts, or pairs that only look alike in certain fonts, may not be flagged.',
    },
  ],
}

export default content
