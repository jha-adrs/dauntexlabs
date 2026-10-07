import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Cheques, invoices, receipts and salary slips in India need the amount written in words, using lakh and crore rather than million and billion. This converter turns any rupee amount into words the Indian way, for example ₹12,34,56,789.05 becomes "Twelve Crore Thirty-Four Lakh Fifty-Six Thousand Seven Hundred Eighty-Nine Rupees and Five Paise Only".',
    'You can switch between English and Hindi. Hindi numbers from 1 to 99 each have their own word (इक्कीस, बाईस, निन्यानवे and so on), and the tool uses those forms rather than building them from parts. It also shows the amount with Indian digit grouping (12,34,56,789) so you can check the figure you typed.',
    'The conversion runs in your browser as you type.',
  ],
  steps: [
    'Type or paste the amount in rupees. Commas, spaces and the ₹ sign are fine.',
    'Add up to two decimal places for paise, for example 1500.50.',
    'Choose English or Hindi.',
    'Turn "Only" on or off to match how your cheque or invoice is written.',
    'Copy the words, or the amount in Indian digit grouping, with the copy buttons.',
  ],
  faq: [
    {
      q: 'How do I write an amount in words on a cheque in India?',
      a: 'Write the rupees in words using thousand, lakh and crore, add the paise if there are any, and end with "Only" so nothing can be added after it. For ₹1,00,000 that is "One Lakh Rupees Only". Write it as close to the "Rupees" line as possible.',
    },
    {
      q: 'How are amounts above 99 crore written?',
      a: 'The Indian system keeps counting in crore, so the number of crores is itself spelled out. ₹1,00,00,00,000 is "One Hundred Crore Rupees". The tool supports amounts up to ₹99,99,99,99,99,999.99.',
    },
    {
      q: 'Is it "Rupee" or "Rupees", "Paisa" or "Paise"?',
      a: 'Exactly one is singular ("One Rupee", "One Paisa"); every other amount, including zero, is plural ("Zero Rupees", "Fifty Paise"). The tool applies this automatically, in Hindi too (रुपया / रुपये, पैसा / पैसे).',
    },
    {
      q: 'How do I write the amount in Hindi words?',
      a: 'Choose Hindi. ₹1,00,000 becomes "एक लाख रुपये मात्र", where मात्र plays the role of "Only". Numbers 1–99 use their traditional Hindi forms, checked against Wiktionary entries.',
    },
    {
      q: 'What happens with more than two decimal places or a negative number?',
      a: 'The tool shows an error, because paise only go to two decimal places and a cheque or invoice amount cannot be negative. Round the amount first, then convert it.',
    },
  ],
}

export default content
