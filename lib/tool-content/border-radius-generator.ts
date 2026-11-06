import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This CSS border radius generator lets you round the corners of a box with sliders and see the result on a live preview square. Each corner can be set from 0 to 200 pixels, and the matching border-radius declaration is written out for you to copy straight into your stylesheet.',
    'It is handy when you want to try out shapes such as pills, tabs, speech-bubble corners or leaf shapes without editing CSS and reloading. Everything is calculated in your browser as you drag.',
  ],
  steps: [
    'Leave "link all corners" on to round every corner by the same amount with any one slider.',
    'Turn "link all corners" off to set the top-left, top-right, bottom-right and bottom-left sliders independently.',
    'Watch the preview square update as you drag each slider.',
    'Copy the CSS line from the CSS panel and paste it into the rule for your element.',
  ],
  faq: [
    {
      q: 'What order are the four values in border-radius?',
      a: 'The shorthand lists corners clockwise from the top-left: top-left, top-right, bottom-right, bottom-left. So "border-radius: 10px 20px 30px 40px;" gives 10px at top-left and 40px at bottom-left. When all four corners match, the generator outputs a single value instead.',
    },
    {
      q: 'How do I make a circle or a pill shape?',
      a: 'For a circle, give a square element a radius of at least half its width, or use 50% in your own CSS. For a pill, use a radius equal to or larger than half the element height; browsers scale overlapping radii down so the curves fit, which is why a very large value such as 9999px is a common trick. This generator works in pixels only, so switch to a percentage by hand if you need one.',
    },
    {
      q: 'Can I create elliptical corners with different horizontal and vertical radii?',
      a: 'Not with this tool. CSS supports elliptical corners using the slash syntax, for example "border-radius: 50px / 25px;", but the generator produces circular radii only. You can start from its output and add the slash part yourself.',
    },
    {
      q: 'Does border-radius clip the content inside the element?',
      a: 'It rounds the background and border, but child content such as an image can still poke out past the curve. Add overflow: hidden to the element if you want its contents clipped to the rounded shape.',
    },
    {
      q: 'Is border-radius supported in all browsers?',
      a: 'Yes. The unprefixed border-radius property works in every current browser, so the -webkit- and -moz- prefixes once needed for it are no longer required.',
    },
  ],
}

export default content
