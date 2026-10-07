import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This Morse code translator converts plain text into International Morse code and decodes Morse back into text. Letters are written with dots (.) and dashes (-), letters are separated by spaces, and words are separated by a slash, so "SOS HELP" becomes "... --- ... / .... . .-.. .--.".',
    'It is handy for puzzles, escape rooms, ham radio practice, school projects or just writing a secret note. Translation happens instantly in your browser as you type, and you can copy the result with one click.',
  ],
  steps: [
    'Choose Encode to turn text into Morse, or Decode to turn Morse into text.',
    'Type or paste into the input box on the left.',
    'When decoding, separate letters with a space and words with " / ".',
    'Read the translation on the right and press the copy button to copy it.',
  ],
  faq: [
    {
      q: 'Which characters can be translated?',
      a: 'The letters A to Z and the digits 0 to 9 from International Morse code. Upper and lower case are treated the same. Punctuation and accented letters are not supported yet, and the tool shows an error until you remove them.',
    },
    {
      q: 'How do I separate letters and words when decoding Morse code?',
      a: 'Put a single space between letters and a forward slash between words, for example ".... .. / - .... . .-. ." for "HI THERE". Extra spaces around the slash are fine.',
    },
    {
      q: 'What is SOS in Morse code?',
      a: 'SOS is "... --- ..." — three dots, three dashes, three dots. In real radio use it is sent as one continuous signal without letter gaps, but written out it looks like that.',
    },
    {
      q: 'Can I hear the Morse code as audio?',
      a: 'Not at the moment. This translator works with written dots and dashes only and does not play sound.',
    },
    {
      q: 'Why does decoding show "Unrecognized morse sequence"?',
      a: 'At least one group of dots and dashes does not match a letter or digit. Common causes are a missing space that runs two letters together, a stray character other than a dot, dash, space or slash, or symbols such as an underscore used in place of a dash.',
    },
  ],
}

export default content
