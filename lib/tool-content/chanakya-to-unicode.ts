import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Chanakya is a legacy Hindi font family used in newspaper layouts, press releases, printed advertisements and older office files. Chanakya text is stored as accented Latin characters, so without the font "भारत" shows up as "ÖæÚUÌ". This converter turns Chanakya text into Unicode Hindi that you can edit, search, email or publish online. It also converts Unicode Hindi into Chanakya for layouts that still need the old font.',
    'The converter moves the short "i" matra (typed before its letter) and the reph (typed after its syllable) into their proper places. It drops the invisible spacing glyphs Chanakya inserts after letters such as क and र, and it handles conjuncts, nukta and both of Chanakya\'s digit styles. The text is processed on your device, in your browser.',
  ],
  steps: [
    'Leave Legacy → Unicode selected to convert Chanakya text, or pick Unicode → Legacy to produce Chanakya text.',
    'Paste the text copied from your document, PDF or layout file into the left box.',
    'Read the Unicode Hindi on the right. If a notice says the input already looks like Unicode, switch the direction.',
    'Copy the result or download it as a .txt file.',
    'For Chanakya output, apply the Chanakya font in your layout or word processor so the text displays as Hindi.',
  ],
  faq: [
    {
      q: 'How do I convert Chanakya font text to Unicode?',
      a: 'Paste the Chanakya text with Legacy → Unicode selected. The Unicode Hindi appears instantly on the right, ready to copy or download.',
    },
    {
      q: 'Why does Chanakya text look like ÖæÚUÌ?',
      a: 'Chanakya maps Hindi glyphs onto accented Latin characters. Only the Chanakya font draws them as Hindi; anywhere else you see the raw characters. Unicode Hindi does not depend on a particular font.',
    },
    {
      q: 'How are numbers handled?',
      a: 'Chanakya has two sets of digit keys: one draws Devanagari digits (०१२…) and the other draws ordinary 0–9. The converter keeps the digit style you can see in the original text.',
    },
    {
      q: 'Can I convert Unicode Hindi to Chanakya?',
      a: 'Yes. Choose Unicode → Legacy and paste Unicode text. The result includes the spacing glyphs Chanakya uses, and it displays correctly once the Chanakya font is applied.',
    },
    {
      q: 'Will every character convert?',
      a: 'The common letters, matras and conjuncts convert. A handful of rare glyphs that published Chanakya tables disagree on are left unchanged rather than guessed, so proofread names and rare words.',
    },
  ],
}

export default content
