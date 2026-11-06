import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This number to words converter spells out a whole number in English, so 1234 becomes one thousand two hundred thirty-four. It is handy for writing amounts on forms and letters, checking how a large figure is read aloud, or producing text for documents where numbers must also appear in words.',
    'It uses the international short scale of thousand, million, billion, trillion and quadrillion, with hyphens for compound tens such as forty-two. It does not use the Indian lakh and crore system or add currency words; for rupee amounts with lakh, crore and paise, use the Amount in Words (Rupees) tool instead. The conversion runs in your browser as you type.',
  ],
  steps: [
    'Type a whole number into the number box, for example 1234 or -99.',
    'Read the spelled-out result in the words panel.',
    'Turn on Capitalize first letter if the words will start a sentence.',
    'Click copy to put the text on your clipboard.',
  ],
  faq: [
    {
      q: 'How large a number can it spell out?',
      a: 'Up to 999,999,999,999,999,999, which is just under one quintillion. The quadrillion group is the largest scale word it knows, so a longer number shows a message that it is too large.',
    },
    {
      q: 'Does it handle decimals or commas?',
      a: 'No. Enter digits only, with an optional leading minus sign. Commas, spaces, a decimal point or a currency symbol produce an error asking for a valid integer, so type 1500000 rather than 1,500,000.',
    },
    {
      q: 'What about negative numbers and zero?',
      a: 'A leading minus sign gives a result starting with negative, for example negative ninety-nine. Zero is written as zero.',
    },
    {
      q: 'Does it write "one hundred and five" with "and"?',
      a: 'No. It follows the style common in American English and writes one hundred five, without and. If your document needs the British style, add the word where required after copying.',
    },
    {
      q: 'Can it write amounts in lakh and crore?',
      a: 'Not this tool. It always groups by thousands, so 2500000 becomes two million five hundred thousand. The Amount in Words (Rupees) tool writes the same figure as twenty-five lakh and also supports paise and Hindi.',
    },
  ],
}

export default content
