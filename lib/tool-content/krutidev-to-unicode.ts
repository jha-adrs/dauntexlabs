import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Kruti Dev 010 is the legacy Hindi font that many government offices, courts and typing institutes still use. It is not real Hindi text: it shows Hindi letters by drawing them over ordinary keyboard characters. Open a Kruti Dev file without the font and "भारत" turns into "Hkkjr". This converter turns Kruti Dev text into proper Unicode Hindi that works in email, WhatsApp, Google Docs, websites and search. It also converts Unicode Hindi back into Kruti Dev when a form, a court template or typing software expects it.',
    'Kruti Dev is a visual encoding. The short "i" matra (ि) is typed before its letter, and the reph (र् written above a letter) is typed after it. The converter reorders both, handles half letters, conjuncts such as क्ष, त्र, ज्ञ and श्र, nukta and halant, and maps Kruti Dev punctuation (A becomes the purna viram ।). The conversion runs in your browser, so your text is processed on your device.',
  ],
  steps: [
    'Leave the direction on Legacy → Unicode to convert Kruti Dev text, or pick Unicode → Legacy to go the other way.',
    'Paste your text. In Word, copy it straight from the document; the formatting does not matter.',
    'Read the converted text on the right. If a notice says the text already looks like Unicode, switch the direction.',
    'Copy the result, or download it as a .txt file.',
    'For Unicode → Legacy output, paste it into Word or your typing software and set the font to Kruti Dev 010 so it displays as Hindi.',
  ],
  faq: [
    {
      q: 'How do I convert Kruti Dev to Unicode?',
      a: 'Paste the Kruti Dev text into the left box with Legacy → Unicode selected. The Unicode Hindi appears on the right straight away, ready to copy or download.',
    },
    {
      q: 'Why does my Kruti Dev text show as English letters?',
      a: 'Kruti Dev stores Hindi as Latin keyboard characters, and only the Kruti Dev font draws them as Hindi. On a computer without the font, or after pasting into an app that changes the font, you see the raw characters such as "fgUnh" instead of "हिन्दी". Converting to Unicode fixes this for good.',
    },
    {
      q: 'Can I convert Unicode (Mangal) Hindi to Kruti Dev?',
      a: 'Yes. Choose Unicode → Legacy and paste text typed in Mangal, Nirmala UI or any Unicode Hindi font. The output only looks right once the Kruti Dev 010 font is applied to it.',
    },
    {
      q: 'Does it handle ि, reph and conjuncts correctly?',
      a: 'Yes. It moves the short-i matra after its letter (fgUnh → हिन्दी), places the reph correctly (deZ → कर्म) and converts common conjuncts. Unusual glyphs the converter does not know are left as they are, so check names and rare words before you file a document.',
    },
    {
      q: 'Is this useful for typing test practice?',
      a: 'Hindi typing practice for government exams is often done on the Kruti Dev (Remington) layout. You can convert a Unicode passage to Kruti Dev to practise with it, or convert your typed Kruti Dev text to Unicode to check it.',
    },
    {
      q: 'Is DevLys the same as Kruti Dev?',
      a: 'DevLys 010 uses the same keyboard layout as Kruti Dev 010, so text in either converts the same way. There is a separate DevLys page if that is the name you know it by.',
    },
  ],
}

export default content
