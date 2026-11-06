import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'This CSS gradient generator builds a two-colour linear or radial gradient and gives you the background rule to paste into your stylesheet. Pick the colours, drag the angle, adjust where each colour starts and watch the live preview update as you go. It is meant for the everyday cases: a hero banner, a button, a card header or a subtle page background.',
    'The output is plain CSS, a single background: linear-gradient(...) or radial-gradient(...) declaration, so it works in every current browser without prefixes or extra libraries. The generator runs in your browser.',
  ],
  steps: [
    'Choose Linear or Radial at the top.',
    'For a linear gradient, drag the Angle slider from 0° to 360°. 90° runs left to right and 180° runs top to bottom.',
    'Pick a colour for Stop 1 and Stop 2 with the colour pickers.',
    'Optionally change each Position, for example 0% and 100%, or 30% and 70% for a shorter blend. Leave a position empty to let the browser spread the colours evenly.',
    'Check the preview, then copy the rule from the CSS output panel.',
  ],
  faq: [
    {
      q: 'How do I make a CSS linear gradient?',
      a: 'Use background: linear-gradient(angle, colour position, colour position). For example, background: linear-gradient(90deg, #0f7a4a 0%, #10261b 100%) fades from green on the left to near-black on the right. This tool writes that line for you from the angle, colours and positions you choose.',
    },
    {
      q: 'What do the stop positions do?',
      a: 'A position says where along the gradient a colour is fully reached. With 0% and 100% the blend covers the whole element. Moving them closer, say 40% and 60%, makes a sharper transition with solid colour on either side. If both stops share the same position you get a hard edge with no blend at all.',
    },
    {
      q: 'What shape does the radial gradient use?',
      a: 'Radial mode writes radial-gradient(circle, ...), so the first colour starts at the centre of the element and spreads out in a circle. The angle slider is hidden in this mode because a circle has no direction. If you need an ellipse or an off-centre origin, edit the copied rule by hand.',
    },
    {
      q: 'Can I add more than two colours?',
      a: 'Not in this tool: it has exactly two colour stops. CSS itself accepts any number, so you can copy the output and add more stops inside the brackets, separated by commas, such as linear-gradient(90deg, red 0%, yellow 50%, green 100%).',
    },
    {
      q: 'Does it support transparency or conic gradients?',
      a: 'No. The colour pickers produce solid hex colours, and only linear and radial gradients are offered. For a fade to transparent, replace one colour in the copied rule with an rgba() value or the keyword transparent.',
    },
  ],
}

export default content
