import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Before take-off or landing you need to know how much of the wind blows across the runway and how much blows along it. This crosswind component calculator splits the reported wind into a headwind (or tailwind) component and a crosswind component for any runway, and tells you which side the crosswind comes from.',
    'It uses basic trigonometry: the headwind is the wind speed times the cosine of the angle between wind and runway, and the crosswind is the wind speed times the sine of that angle. Compare the crosswind with your aircraft\'s maximum demonstrated crosswind and your own personal limits. It runs in your browser.',
  ],
  steps: [
    'Enter the runway heading in degrees. Runway 27 is about 270°; use the published runway heading if you want more precision.',
    'Enter the wind direction it blows from and its speed in knots, from the ATIS, METAR or tower.',
    'If the wind is gusting, run it again with the gust speed to see the worst case.',
    'Read the headwind or tailwind component and the crosswind component with its side.',
  ],
  faq: [
    {
      q: 'How do you calculate crosswind component?',
      a: 'Find the angle between the wind direction and the runway heading. The crosswind component is wind speed times the sine of that angle and the headwind component is wind speed times the cosine. For runway 27 with wind 300° at 20 kt the angle is 30°, giving 10.0 kt of crosswind from the right and 17.3 kt of headwind.',
    },
    {
      q: 'Is there a quick mental method?',
      a: 'A common rule: at 15° off the runway the crosswind is about a quarter of the wind, at 30° about half, at 45° about three quarters, and at 60° or more nearly all of it. This calculator gives the exact figure.',
    },
    {
      q: 'Should I use magnetic or true wind?',
      a: 'Use the same reference for both inputs. Runway headings and wind from the ATIS or tower are magnetic; wind in a written METAR or TAF is true. Mixing them can shift the result by the local magnetic variation.',
    },
    {
      q: 'What does a tailwind result mean?',
      a: 'If the wind comes from behind the runway direction, the calculator shows a tailwind component instead of a headwind. Tailwinds lengthen take-off and landing distances considerably, so consider the opposite runway.',
    },
    {
      q: 'Is this a substitute for my POH limits?',
      a: 'No. It is for training and planning only. Always cross-check with your aircraft\'s POH, including its maximum demonstrated crosswind, and an E6B.',
    },
  ],
}

export default content
