import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Pressure altitude is the height in the standard atmosphere that corresponds to the air pressure where you are: what the altimeter would read with 29.92 inHg (1013.25 hPa) set in the Kollsman window. Aircraft performance charts, density altitude, true airspeed and flight levels all start from it, so it is one of the first numbers in any take-off or cruise performance calculation.',
    'This pressure altitude calculator takes field elevation and the current altimeter setting (QNH) in inHg or hPa and returns the pressure altitude using the standard-atmosphere pressure formula published by the US National Weather Service. It also shows the familiar rule of thumb of 1000 ft per inHg so you can see how close the quick mental method gets. The calculation is designed to run in your browser.',
  ],
  steps: [
    'Enter the field elevation in feet from the airport chart or directory.',
    'Choose inHg or hPa to match the altimeter setting you have.',
    'Enter the altimeter setting from the METAR or ATIS.',
    'Read the pressure altitude and the rule-of-thumb value.',
    'Carry the pressure altitude into the density altitude calculator or your POH performance charts.',
  ],
  faq: [
    {
      q: 'How do you calculate pressure altitude?',
      a: 'The quick method is field elevation plus (29.92 minus the altimeter setting in inHg) × 1000 ft. With an elevation of 1000 ft and a setting of 29.42 inHg that gives 1,500 ft. The full standard-atmosphere formula used here gives about 1,467 ft, because the pressure change per foot is not exactly constant.',
    },
    {
      q: 'What if my altimeter setting is in hectopascals?',
      a: 'Switch the unit to hPa. The standard setting is 1013.25 hPa, and each hectopascal below it adds roughly 27 to 30 ft of pressure altitude near sea level. At exactly 1013.25 hPa the pressure altitude equals the field elevation.',
    },
    {
      q: 'Why is pressure altitude different from field elevation?',
      a: 'Field elevation is a fixed height above mean sea level. Pressure altitude changes with the weather: low pressure makes the airfield "feel" higher to the aircraft, high pressure makes it feel lower.',
    },
    {
      q: 'How is pressure altitude related to density altitude?',
      a: 'Density altitude is pressure altitude corrected for non-standard temperature. Once you have pressure altitude, add the outside air temperature in the density altitude calculator to see how the aircraft will actually perform.',
    },
    {
      q: 'Can I rely on this for flight planning?',
      a: 'It is for training and planning only. Always cross-check with your aircraft\'s POH, an E6B or approved planning software, and the current weather report.',
    },
  ],
}

export default content
