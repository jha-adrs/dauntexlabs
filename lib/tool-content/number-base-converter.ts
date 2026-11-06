import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This number base converter changes whole numbers between binary, octal, decimal and hexadecimal, and also between any two bases from 2 to 36. It is useful for reading memory addresses, bit masks, file permissions, colour codes and anything else that programmers write in a base other than ten.',
    'Numbers are handled as arbitrary-precision integers, so very long binary or hexadecimal strings convert exactly instead of being rounded the way ordinary floating-point numbers would be. As soon as you enter a valid value you also get a table showing it in all four common bases, with 0b, 0o and 0x prefixes and a copy button on each row. Everything is calculated in your browser.',
  ],
  steps: [
    'Choose the input base in From base (base 2, 8, 10 or 16) and type your number in Value.',
    'Choose the output base in To base and read the converted result; click copy to take it.',
    'Check the all common bases table to see binary, octal, decimal and hexadecimal side by side.',
    'For another base, use the arbitrary base (2 – 36) panel: set From base and To base, then type a Value.',
  ],
  faq: [
    {
      q: 'Which digits are allowed for bases above 10?',
      a: 'Letters a to z stand for the values 10 to 35, so hexadecimal uses 0 to 9 and a to f, and base 36 uses the whole alphabet. Upper or lower case both work. Results are written in lower case.',
    },
    {
      q: 'Can I paste a value with a 0x or 0b prefix?',
      a: 'No. Type only the digits, for example ff rather than 0xff. The x or b would be read as a digit, and the tool shows an error saying the input contains digits invalid for that base. Spaces and underscores inside the number are rejected for the same reason.',
    },
    {
      q: 'Does it convert negative numbers or fractions?',
      a: "No. The converter works with non-negative whole numbers only, so a minus sign or a decimal point is treated as an invalid digit. It does not produce two's complement output either.",
    },
    {
      q: 'Is there a size limit?',
      a: 'There is no fixed limit, because the value is held as a big integer rather than a normal JavaScript number. A 64-bit or even 256-bit value converts exactly. Extremely long inputs are limited only by your browser.',
    },
    {
      q: 'Are there pages for specific conversions?',
      a: 'Yes. For common pairs such as binary to decimal or hex to binary, see the conversion pages, which include a worked example and a reference table.',
    },
  ],
}

export default content
