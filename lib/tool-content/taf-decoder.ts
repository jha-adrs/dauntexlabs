import type { ToolContent } from './types'

export default {
  intro: [
    'A TAF (terminal aerodrome forecast) is the coded forecast for the area around an airport, usually covering 24 or 30 hours. It starts with a base forecast and then lists changes: FM groups that replace the forecast from a given time, TEMPO groups for temporary fluctuations, BECMG groups for gradual changes, and PROB30 or PROB40 groups for conditions with a stated probability.',
    'This TAF decoder splits a pasted forecast into those periods and shows each one as its own table, with every raw group next to its plain-English meaning. It uses the same group decoder as our METAR decoder, so wind, visibility, weather, cloud, wind shear and temperature groups read the same way, and any group it does not recognise is kept and labelled "Not decoded".',
    'The page does not fetch weather; you paste a forecast you already have, and decoding is designed to run in your browser on your device.',
  ],
  steps: [
    'Copy a TAF from your official briefing source.',
    'Paste it into the box. The leading TAF word, AMD or COR, line breaks and a trailing "=" are all accepted.',
    'Check the station, issue time and validity period shown above the timeline.',
    'Read each period in order: the base forecast, then each FM, TEMPO, BECMG or PROB group with its time range in UTC.',
  ],
  faq: [
    {
      q: 'How do I read the time groups in a TAF?',
      a: 'Times are in UTC. The validity 0812/0918 means from the 8th at 12:00 to the 9th at 18:00. FM081800 means from the 8th at 18:00, and a range such as 0820/0824 means from 20:00 until midnight on the 8th, which TAFs write as 24:00.',
    },
    {
      q: 'What is the difference between FM, TEMPO and BECMG?',
      a: 'FM starts a new forecast that replaces everything before it from that time. TEMPO describes temporary fluctuations lasting less than an hour at a time and covering less than half of the period. BECMG describes a change that happens gradually during the period and then persists.',
    },
    {
      q: 'What does PROB30 mean?',
      a: 'PROB30 or PROB40 gives a 30% or 40% chance of the conditions that follow during the stated time range. It can be combined with TEMPO, as in PROB30 TEMPO, for a probable temporary change.',
    },
    {
      q: 'What does P6SM mean?',
      a: 'P6SM is used in US TAFs to mean visibility of more than 6 statute miles. Elsewhere you will see metres, with 9999 meaning 10 km or more, or CAVOK.',
    },
    {
      q: 'Can I rely on this for flight planning?',
      a: 'It is for training and planning only. Forecasts are amended often, so always use an official, current briefing and your own judgement for flight decisions.',
    },
  ],
} satisfies ToolContent
