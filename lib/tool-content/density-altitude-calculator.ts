import type { ToolContent } from './types'

const content: ToolContent = {
  intro: [
    'Density altitude is the altitude in the standard atmosphere at which the air would have the same density as the air you are actually flying in. On a hot day at a high airfield the air is thin, so the aircraft performs as if it were much higher: longer take-off roll, weaker climb and less engine power. This density altitude calculator works it out from pressure altitude, outside air temperature and, optionally, dewpoint.',
    'It uses the International Standard Atmosphere (15 °C at sea level, cooling about 1.98 °C per 1000 ft) and the standard relation between pressure, temperature and density, the same approach the US National Weather Service publishes. If you enter a dewpoint it also accounts for humidity, since moist air is slightly less dense than dry air. It shows the ISA temperature for your pressure altitude and how far today is above or below standard. The calculation runs in your browser.',
  ],
  steps: [
    'Find your pressure altitude: set the altimeter to 29.92 inHg (1013 hPa) and read it, or correct field elevation for the current altimeter setting.',
    'Enter the outside air temperature in degrees Celsius.',
    'Optionally enter the dewpoint from the METAR to include the effect of humidity.',
    'Read the density altitude, the ISA temperature and the deviation from ISA.',
    'Use the density altitude with your aircraft performance charts, and cross-check against the POH.',
  ],
  faq: [
    {
      q: 'How do you calculate density altitude?',
      a: 'Pressure altitude gives the air pressure and temperature gives the actual air temperature. From those the calculator works out the air density relative to sea-level standard, then finds the altitude in the standard atmosphere with the same density. A common rule of thumb is pressure altitude plus 120 ft for every degree Celsius above ISA; this tool uses the full formula, so its answer can differ from the rule of thumb by a couple of hundred feet.',
    },
    {
      q: 'What is the ISA temperature at my altitude?',
      a: 'ISA starts at 15 °C at sea level and drops about 1.98 °C per 1000 ft. At 5000 ft pressure altitude that is 5.1 °C. The calculator shows this value and how many degrees warmer or colder the actual temperature is.',
    },
    {
      q: 'Does humidity affect density altitude?',
      a: 'Yes, a little. Water vapour is lighter than dry air, so humid air is less dense. Entering a dewpoint adds this effect; on a warm, humid day it can raise density altitude by a few hundred feet.',
    },
    {
      q: 'Why is high density altitude dangerous?',
      a: 'Thin air reduces engine power, propeller thrust and wing lift at a given indicated airspeed. Take-off distance grows and climb rate falls, which matters most at high, hot airfields with short runways or rising terrain.',
    },
    {
      q: 'Can I use this instead of my POH or E6B?',
      a: 'No. It is for training and planning only. Always check performance with your aircraft\'s POH charts and cross-check with an E6B or approved flight planning tool.',
    },
  ],
}

export default content
