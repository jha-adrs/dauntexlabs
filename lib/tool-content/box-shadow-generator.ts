import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This CSS box shadow generator lets you design a box-shadow with sliders and a colour picker and see it on a live preview. Adjust the horizontal and vertical offset, blur, spread and colour, switch on inset for an inner shadow, and copy the finished box-shadow declaration.',
    'It is useful for building card elevations, focus glows, pressed-button effects or hard offset shadows without trial and error in your stylesheet. The CSS is produced in your browser as you move the controls. The generator builds a single shadow; for layered shadows, copy several outputs and join them with commas.',
  ],
  steps: [
    'Drag offset-x and offset-y (from -100 to 100 pixels) to move the shadow right, left, down or up.',
    'Set blur (0 to 200 pixels) to soften the edge; 0 gives a hard, crisp shadow.',
    'Use spread (-100 to 100 pixels) to grow or shrink the shadow before it is blurred.',
    'Pick a colour with the color control and turn on inset if you want the shadow inside the box.',
    'Copy the box-shadow line from the CSS panel into your stylesheet.',
  ],
  faq: [
    {
      q: 'What do the values in box-shadow mean?',
      a: 'In order they are: an optional inset keyword, the horizontal offset, the vertical offset, the blur radius, the spread radius and the colour. Positive offsets move the shadow right and down; negative values move it left and up. Blur cannot be negative, while spread can be negative to make the shadow smaller than the element.',
    },
    {
      q: 'What is the difference between blur and spread?',
      a: 'Spread changes the size of the shadow shape itself, expanding or contracting it on every side. Blur then fades the edge of that shape, so a larger blur gives a softer, more diffuse shadow. A shadow with zero offsets, zero blur and some spread looks like a solid outline.',
    },
    {
      q: 'What does inset do?',
      a: "Inset draws the shadow inside the element's border instead of outside it, which makes the box look pressed in or recessed. It is commonly used for input fields and active button states.",
    },
    {
      q: 'How do I make a subtle, transparent shadow?',
      a: 'The colour picker produces solid hex colours, so very soft shadows usually come from a light grey colour with plenty of blur. If you want real transparency, replace the hex value in the copied CSS with an rgba() colour such as rgba(0, 0, 0, 0.15).',
    },
    {
      q: 'Can I add more than one shadow?',
      a: 'CSS allows several shadows separated by commas, for example a tight dark shadow plus a wide soft one. This tool builds one shadow at a time, so generate each layer and combine them by hand in a single box-shadow declaration.',
    },
  ],
}

export default content
