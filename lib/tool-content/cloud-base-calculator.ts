import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'The cloud base calculator estimates the height of the base of cumulus cloud above the ground from two numbers every METAR gives you: the surface temperature and the dewpoint. As a parcel of air rises it cools at roughly 3 °C per 1000 ft while its dewpoint falls by only about 0.5 °C per 1000 ft, so the two meet, and cloud forms, about 1000 ft higher for every 2.5 °C of spread at the surface.',
    'The tool shows that classic "spread ÷ 2.5 × 1000" figure alongside the equivalent "400 ft per °C" form that many pilots memorise, plus the relative humidity worked out with the Magnus formula. You can enter values in Celsius or Fahrenheit. The arithmetic is designed to run in your browser, so you can use it during pre-flight planning without an account.',
  ],
  steps: [
    'Read the temperature and dewpoint from the METAR, for example 25/15.',
    'Choose °C or °F to match your source.',
    'Enter the surface temperature and the dewpoint.',
    'Read the estimated cloud base above ground level and the relative humidity.',
    'Compare the estimate with reported ceilings and forecasts before deciding on a VFR flight.',
  ],
  faq: [
    {
      q: 'How do you calculate cloud base from temperature and dewpoint?',
      a: 'Subtract the dewpoint from the temperature to get the spread in °C, divide by 2.5 and multiply by 1000. A 25 °C day with a 15 °C dewpoint has a 10 °C spread, giving an estimated base of 4,000 ft above ground. Multiplying the spread by 400 gives the same answer.',
    },
    {
      q: 'Is the result above ground or above sea level?',
      a: 'Above ground level (AGL) at the station that reported the temperature and dewpoint. Add the station elevation if you need the base above mean sea level, for example to compare with terrain or an airspace ceiling on a chart.',
    },
    {
      q: 'How accurate is this cloud base estimate?',
      a: 'It works best for fair-weather cumulus formed by surface heating on a well-mixed day. It does not predict stratus, fog, frontal cloud or cloud advected from elsewhere, and real bases can differ by several hundred feet. Treat it as a planning estimate and rely on observed ceilings and forecasts.',
    },
    {
      q: 'What does the relative humidity tell me?',
      a: 'Relative humidity is how close the air is to saturation. When the temperature and dewpoint are equal it is 100 % and cloud or fog can form at the surface; a small spread with falling temperature in the evening is a common warning sign for fog.',
    },
    {
      q: 'Can I use Fahrenheit values?',
      a: 'Yes. Switch the unit to °F and enter both values in Fahrenheit; the calculator converts them to Celsius before applying the rule, so the result is the same.',
    },
  ],
}

export default content
