import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This Roman numeral converter works in both directions: it turns an ordinary number into Roman numerals and reads a Roman numeral back as a number. It is useful for copyright years in film credits, clock faces, book chapters and appendices, event names, tattoos and homework.',
    'It uses standard subtractive notation, the form most style guides expect, so 4 is IV, 9 is IX, 40 is XL and 1994 is MCMXCIV. Results appear as you type and the conversion runs in your browser.',
  ],
  steps: [
    'Pick a direction with the Number → Roman or Roman → Number switch.',
    'Type a whole number from 1 to 3999, or a Roman numeral such as MMXXVI.',
    'Read the result in the output panel; an error explains what is wrong with invalid input.',
    'Click copy to put the result on your clipboard.',
  ],
  faq: [
    {
      q: 'What range of numbers is supported?',
      a: 'Whole numbers from 1 to 3999, which is MMMCMXCIX. Standard Roman numerals have no zero, no negatives and no fractions, and numbers of 4000 and above need overline notation that this tool does not produce.',
    },
    {
      q: 'Why is IIII or IC rejected?',
      a: 'When reading Roman numerals, the tool only accepts the standard form. A symbol may repeat at most three times, and subtraction is limited to the six pairs IV, IX, XL, XC, CD and CM. So IIII, VV, IC and MMMM are reported as not valid, even though some clocks and older texts use them.',
    },
    {
      q: 'Can I type numerals in lower case?',
      a: 'Yes. Lower case such as xiv is read the same as XIV. The output is always written in capitals.',
    },
    {
      q: 'How do I write the current year in Roman numerals?',
      a: 'Choose Number → Roman and enter the year. For example 2026 is MMXXVI: MM for 2000, XX for 20 and VI for 6.',
    },
    {
      q: 'Does it accept decimals?',
      a: 'No. A value such as 12.5 shows an error asking for an integer between 1 and 3999.',
    },
  ],
}

export default content
