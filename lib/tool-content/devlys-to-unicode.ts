import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'DevLys 010 is a legacy Hindi font that is still common in office letters, notices and older Word documents. Like Kruti Dev, it is not real Hindi text: it draws Hindi letters over ordinary keyboard characters, so a DevLys file opened without the font looks like "Hkkjr" instead of "भारत". This tool converts DevLys text to Unicode Hindi, which displays correctly everywhere and can be searched, emailed and published online. It also converts Unicode Hindi back into DevLys.',
    'DevLys 010 shares its keyboard layout with Kruti Dev 010, so the same character map is used for both. The converter reorders the short "i" matra, which is typed before its letter, and the reph, which is typed after it. It also handles half letters, conjuncts, nukta and halant, and Devanagari punctuation. Everything is processed on your device, in your browser.',
  ],
  steps: [
    'Keep Legacy → Unicode selected to convert DevLys text, or choose Unicode → Legacy to produce DevLys text.',
    'Copy the text from your Word file or PDF and paste it into the left box.',
    'Check the converted text on the right. A notice appears if the input looks like it belongs to the other direction.',
    'Copy the result or download it as a .txt file.',
    'If you converted to DevLys, apply the DevLys 010 font in Word so the text shows as Hindi.',
  ],
  faq: [
    {
      q: 'How do I convert DevLys 010 to Unicode?',
      a: 'Paste the DevLys text with Legacy → Unicode selected. The Unicode Hindi appears on the right and can be copied or downloaded as a text file.',
    },
    {
      q: 'Is DevLys 010 the same as Kruti Dev 010?',
      a: 'They are different font designs that use the same keyboard layout, so the same keys produce the same letters. That is why one character map converts both.',
    },
    {
      q: 'Why does DevLys text turn into English letters?',
      a: 'The text is stored as ordinary Latin characters and only the DevLys font draws them as Hindi. Without the font you see the underlying characters. Unicode text does not have this problem.',
    },
    {
      q: 'Can I convert Unicode Hindi to DevLys?',
      a: 'Yes. Choose Unicode → Legacy, paste your Unicode text and copy the output. It will only display as Hindi once the DevLys 010 font is applied to it.',
    },
    {
      q: 'What if a few characters look wrong after converting?',
      a: 'The converter knows the common letters, matras and conjuncts. Rare glyphs it does not recognise are left unchanged rather than guessed, so proofread names and uncommon words before you use the text.',
    },
  ],
}

export default content
