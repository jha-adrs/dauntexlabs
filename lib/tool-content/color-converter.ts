import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This colour converter takes a HEX colour code and gives you the same colour as HEX, RGB and HSL, ready to paste into CSS. Type a code like #0f7a4a or the short form #f00, or pick a colour with the colour picker, and the converted values and a large swatch update instantly. It is a quick hex to rgb and hex to hsl tool for front-end work, design hand-off and theme files.',
    'Input is HEX only. The tool does not read rgb() or hsl() text, so for an rgb to hsl conversion you first need the colour as HEX, for example by setting it in the colour picker. The maths runs in your browser.',
  ],
  steps: [
    'Type a code into the HEX color field, with or without the leading #, in #rgb or #rrggbb form.',
    'Or click the colour picker square next to it and choose a colour visually.',
    'Check the swatch to confirm it is the colour you expect.',
    'Use the copy button beside HEX, RGB or HSL to copy that value.',
  ],
  faq: [
    {
      q: 'Which formats does it output?',
      a: 'Three: HEX as a full six-digit lowercase code (#ff0000), RGB as rgb(255, 0, 0) and HSL as hsl(0, 100%, 50%). It does not output CMYK, HSV, named colours or alpha values.',
    },
    {
      q: 'How do I convert hex to rgb?',
      a: 'Enter the hex code in the HEX color field and read the RGB row. Each pair of hex digits becomes a number from 0 to 255 for red, green and blue, so #0f7a4a is rgb(15, 122, 74).',
    },
    {
      q: 'Can I convert rgb to hsl directly?',
      a: "Not by typing rgb() values, because the input accepts HEX only. Your browser's colour picker usually lets you enter red, green and blue numbers; set them there and the HSL row shows the matching hsl() value.",
    },
    {
      q: 'Why does my code show as invalid?',
      a: 'Only three- or six-digit hex codes are accepted. Eight-digit codes with transparency, four-digit codes, colour names and rgb() text show the invalid hex color message.',
    },
    {
      q: 'Are the HSL values exact?',
      a: 'Hue, saturation and lightness are rounded to whole numbers, so converting the HSL back may land one step away from the original in some channels. HEX and RGB are exact.',
    },
  ],
}

export default content
