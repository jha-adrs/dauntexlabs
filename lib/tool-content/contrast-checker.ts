import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This colour contrast checker measures how readable text is against its background using the WCAG 2 contrast ratio. Enter a foreground and a background colour and it shows the ratio, from 1:1 for identical colours up to 21:1 for black on white, and whether the pair passes AA and AAA for normal and large text.',
    'Designers use it to pick accessible brand colours, developers to check a button or link before shipping, and anyone writing an accessibility audit to record a ratio. A live preview shows both text sizes in your chosen colours. The calculation runs in your browser.',
  ],
  steps: [
    'Type a hex code into Foreground color, such as #333 or #0f7a4a, or click the colour swatch next to it to pick one.',
    'Do the same for Background color.',
    'Look at the preview to see normal and large text in those colours.',
    'Read the contrast ratio and the four pass or fail badges: AA Normal, AA Large, AAA Normal and AAA Large.',
    'If a badge fails, darken or lighten one of the colours and check again.',
  ],
  faq: [
    {
      q: 'What contrast ratio do I need for WCAG AA?',
      a: 'WCAG 2 level AA asks for at least 4.5:1 for normal body text and 3:1 for large text. Level AAA is stricter: 7:1 for normal text and 4.5:1 for large text. The line under the badges in the results panel repeats these thresholds.',
    },
    {
      q: 'What counts as large text?',
      a: 'In WCAG 2, large text is at least 18 point (about 24px) regular, or 14 point (about 18.7px) bold. Headings often qualify; body copy, captions and form labels usually do not, so they need the normal-text ratio.',
    },
    {
      q: 'How is the contrast ratio calculated?',
      a: 'Each colour is converted to its relative luminance, a weighted mix of its red, green and blue channels after removing the sRGB gamma curve. The ratio is (lighter + 0.05) ÷ (darker + 0.05). It does not matter which colour is the text: swapping foreground and background gives the same ratio.',
    },
    {
      q: 'Which colour formats can I enter?',
      a: 'Hex only, in three-digit (#abc) or six-digit (#aabbcc) form; the # is optional. The colour swatches open your system colour picker, which can usually take RGB values and fills in the hex for you. Named colours, rgb() text, HSL and transparency are not read; an invalid code shows an error instead of a result.',
    },
    {
      q: 'Does it check APCA or WCAG 3?',
      a: 'No. It reports the WCAG 2 ratio, which is the measure most accessibility laws and audits refer to today. APCA, the method proposed for WCAG 3, is still a draft and is not calculated here.',
    },
  ],
}

export default content
