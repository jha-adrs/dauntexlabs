import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Walkman-Chanakya (the 901 and 905 fonts) is a legacy Hindi font used in government reports, printed books and InDesign or PageMaker layouts. The text is stored as Latin letters and symbols, so without the font "भारत" shows up as "Hkkjr". This converter turns Walkman-Chanakya text into Unicode Hindi that you can edit, search, email or publish online. It also converts Unicode Hindi into Walkman-Chanakya for layouts that still use the old font.',
    'Walkman-Chanakya uses the same typewriter layout as Kruti Dev for most letters, but many symbols differ: brackets, the semicolon, digits, and conjuncts such as द्ध, प्र and क्र live on different keys. A Kruti Dev converter therefore garbles Walkman text. This tool uses its own Walkman table, checked against published character maps and real Walkman-Chanakya documents. It moves the short "i" matra and the reph into their proper places. The text is processed on your device, in your browser.',
  ],
  steps: [
    'Leave Legacy → Unicode selected to convert Walkman-Chanakya text, or pick Unicode → Legacy to produce Walkman-Chanakya text.',
    'Paste the text copied from your document, PDF or layout file into the left box.',
    'Read the Unicode Hindi on the right. If a notice says the input already looks like Unicode, switch the direction.',
    'Copy the result or download it as a .txt file.',
    'For Walkman-Chanakya output, apply the Walkman-Chanakya 901 or 905 font in your layout or word processor so the text displays as Hindi.',
  ],
  faq: [
    {
      q: 'How do I convert Walkman-Chanakya 901 text to Unicode?',
      a: 'Paste the Walkman-Chanakya text with Legacy → Unicode selected. The Unicode Hindi appears instantly on the right, ready to copy or download. Text in Walkman-Chanakya 905 converts the same way, because both fonts use the same encoding.',
    },
    {
      q: 'Is Walkman-Chanakya the same as Chanakya or Kruti Dev?',
      a: 'No. Chanakya (used by some newspapers) stores Hindi as accented letters such as "ÖæÚUÌ", while Walkman-Chanakya uses plain letters such as "Hkkjr". Walkman-Chanakya looks close to Kruti Dev, but its brackets, digits and several conjuncts sit on different keys, so pick the converter that matches your font.',
    },
    {
      q: 'Can I convert text copied from a PDF?',
      a: 'Yes, if the PDF was made with the Walkman-Chanakya font and copying gives you letters like "vkfFkZd" rather than Hindi. Paste that text here. Line breaks and spacing from the PDF are kept as they are, so tidy them afterwards if needed.',
    },
    {
      q: 'Can I convert Unicode Hindi to Walkman-Chanakya?',
      a: 'Yes. Choose Unicode → Legacy and paste Unicode text. The result displays correctly once the Walkman-Chanakya font is applied to it.',
    },
    {
      q: 'Will every character convert?',
      a: 'Common letters, matras, conjuncts, punctuation and digits convert. That includes the "hook" glyph many documents use for के, कु, फ and क्त (typed as "osQ", "oqQ", "iQ" and "ÙkQ"). A few rare glyphs that published Walkman-Chanakya tables disagree on are left unchanged rather than guessed, so search the result for a stray Q and proofread names.',
    },
  ],
}

export default content
