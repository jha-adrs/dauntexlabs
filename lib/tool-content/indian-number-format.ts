import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'India counts large numbers in thousand, lakh and crore and places commas in pairs after the first three digits (1,00,00,000), while most of the world counts in thousand, million and billion and places commas every three digits (10,000,000). News reports, company results, budgets and views counts switch between the two all the time, so figures like "2.5 crore views" or "50,000 crore" need converting before they can be compared.',
    'Type a plain number or a phrase such as 2.5 crore, 50k crore, 1.5 lakh or 3.8 billion. The tool shows the figure with Indian commas and with international commas, the value in lakh, crore and lakh crore, the value in thousand, million, billion and trillion, the number written in words in both systems, and how many zeros it has. Every row has its own copy button.',
    'The arithmetic is done on whole digits rather than floating-point numbers, so large values stay exact and results are never shown in scientific notation. The conversion is designed to run in your browser as you type.',
  ],
  steps: [
    'Type a number, for example 12345678, or a phrase, for example 2.5 crore or 50 thousand crore.',
    'Use short forms if you like: k, lac or lacs, cr, mn, bn and tn all work, and commas in either style are fine.',
    'Read the Indian and international digit grouping, the scale values and the words.',
    'Copy any row with its copy button.',
  ],
  faq: [
    {
      q: 'How many zeros are there in a lakh, a crore and a lakh crore?',
      a: 'A lakh has 5 zeros (1,00,000), a crore has 7 zeros (1,00,00,000) and a lakh crore has 12 zeros (10,00,00,00,00,000). For comparison, a million has 6 zeros, a billion 9 and a trillion 12.',
    },
    {
      q: 'How do I convert crore to million or billion?',
      a: 'One crore is 10 million, so multiply crores by 10 to get millions; 2.5 crore is 25 million. One billion is 100 crore, so divide crores by 100 to get billions; 4,000 crore is 40 billion.',
    },
    {
      q: 'Is a lakh crore the same as a trillion?',
      a: 'Yes. One lakh crore is 10^12, which is one trillion (1,000 billion). So 50 lakh crore is 50 trillion, and 60,000 crore is 0.6 lakh crore or 0.6 trillion.',
    },
    {
      q: 'Where do the commas go in the Indian number system?',
      a: 'The last three digits form one group and every group to the left has two digits: 12,34,56,789. The international system groups every three digits: 123,456,789. Both are the same number.',
    },
    {
      q: 'What can the tool not do?',
      a: 'It handles positive numbers up to 10^18 with at most two decimal places in the final figure. Negative numbers, scientific notation, currency rates and Hindi words are not supported; for rupee amounts in Hindi words, use the Amount in Words (Rupees) tool.',
    },
  ],
}

export default content
