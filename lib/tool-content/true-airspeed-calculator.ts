import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Your airspeed indicator reads lower than your real speed through the air once you climb, because the air is thinner. True airspeed (TAS) is the actual speed of the aircraft relative to the air mass, and it is what you need for navigation and fuel planning. This true airspeed calculator converts calibrated airspeed (CAS) to TAS using pressure altitude and outside air temperature.',
    'It uses the compressible-flow relation from the standard atmosphere: calibrated airspeed gives the impact pressure, pressure altitude gives the static pressure, and together they give the Mach number; the actual temperature then gives the local speed of sound and the true airspeed. This is more accurate than the "2 % per 1000 ft" rule of thumb, especially at higher speeds. The Mach number is shown too. It handles subsonic speeds up to 36,000 ft and runs in your browser.',
  ],
  steps: [
    'Enter calibrated airspeed in knots (indicated airspeed corrected using the airspeed calibration table in your POH).',
    'Enter pressure altitude in feet (altimeter set to 29.92 inHg or 1013 hPa).',
    'Enter outside air temperature in degrees Celsius.',
    'Read the true airspeed in knots and the Mach number.',
  ],
  faq: [
    {
      q: 'How do you calculate true airspeed?',
      a: 'From calibrated airspeed the calculator works out the impact pressure, compares it with the static pressure at your pressure altitude to get the Mach number, then multiplies by the speed of sound at the actual temperature. For example, 150 kt CAS at 8000 ft and 0 °C gives about 169 kt TAS.',
    },
    {
      q: 'What is the difference between IAS, CAS and TAS?',
      a: 'Indicated airspeed is what the instrument shows. Calibrated airspeed corrects that for instrument and position error. True airspeed further corrects for air density, so it is your real speed through the air. Ground speed then adds the effect of wind.',
    },
    {
      q: 'Is the 2 % per 1000 ft rule accurate?',
      a: 'It is a reasonable mental estimate at low altitudes and normal temperatures, but it ignores temperature deviation and compressibility. This calculator uses the full formula, so its answer may differ by a few knots.',
    },
    {
      q: 'Why do I need pressure altitude rather than indicated altitude?',
      a: 'The formula needs the actual static air pressure, and pressure altitude is a direct stand-in for it. Indicated altitude depends on the local altimeter setting, so it does not measure pressure on its own.',
    },
    {
      q: 'Can I rely on this for flight planning?',
      a: 'Use it for training and planning only. Always cross-check with your aircraft\'s POH and an E6B or approved flight planning tool.',
    },
  ],
}

export default content
